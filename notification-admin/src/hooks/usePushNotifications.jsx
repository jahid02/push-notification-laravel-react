import { useState, useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import { toast } from 'react-hot-toast';

export const usePushNotifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [permission, setPermission] = useState(
    typeof window !== 'undefined' ? Notification.permission : 'default'
  );
  const [token, setToken] = useState(localStorage.getItem('fcm_token'));
  const [loading, setLoading] = useState(false);

  // Monitor permission state changes
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    
    // Periodically sync permission in state in case user changes it in settings
    const interval = setInterval(() => {
      if (Notification.permission !== permission) {
        setPermission(Notification.permission);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [permission]);

  // Foreground notification handler
  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground notification received:', payload);
      
      // Construct a new local recipient log record
      const newRecord = {
        id: payload.data?.recipient_id ? parseInt(payload.data.recipient_id) : Date.now(),
        is_read: false,
        created_at: new Date().toISOString(),
        notification: {
          title: payload.notification?.title || payload.data?.title || 'New Notification',
          body: payload.notification?.body || payload.data?.body || '',
          image_url: payload.notification?.image || payload.data?.image_url || null,
          post_id: payload.data?.post_id ? parseInt(payload.data.post_id) : null,
          sender: {
            name: payload.data?.sender_name || 'System Broadcast'
          }
        }
      };

      // Dispatch event to push into state array directly
      window.dispatchEvent(new CustomEvent('new-inbox-notification', { detail: newRecord }));

      // Update unread count immediately
      window.dispatchEvent(new Event('sync-notifications'));

      // Render premium custom glass toast
      toast.custom((t) => (
        <div
          className={`${
            t.visible ? 'animate-fadeIn' : 'opacity-0'
          } max-w-md w-full bg-white/95 border border-border-light backdrop-blur-md shadow-2xl rounded-2xl pointer-events-auto flex p-4 transition-all duration-300 transform scale-100 hover:shadow-glow cursor-pointer`}
          onClick={(e) => {
            // If they didn't click the close button, navigate to post
            if (e.target.tagName !== 'BUTTON') {
              toast.dismiss(t.id);
              const postId = payload.data?.post_id;
              if (postId) {
                if (user?.role === 'reader') {
                  navigate(`/feed/${postId}`);
                } else {
                  navigate(`/posts/${postId}`);
                }
              } else {
                navigate('/inbox');
              }
            }
          }}
        >
          <div className="flex-1 w-0">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center font-bold text-white text-lg shadow-[0_0_12px_rgba(99,102,241,0.3)]">
                  🔔
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-bold text-text-primary font-display">
                  {payload.notification?.title || 'New Message'}
                </p>
                <p className="mt-1 text-xs text-text-secondary font-sans leading-relaxed">
                  {payload.notification?.body || ''}
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-border-color ml-4 pl-4 items-center">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-xs font-bold text-accent-primary hover:text-accent-primary-hover focus:outline-none cursor-pointer tracking-wider uppercase"
            >
              Close
            </button>
          </div>
        </div>
      ), { duration: 8000 });
    });

    return () => unsubscribe();
  }, [user]);

  // Silent sync on login/mount
  useEffect(() => {
    if (!messaging) return;
    
    // Only attempt sync if we are logged in (token is in localStorage) and permission is granted
    const storedAuthToken = localStorage.getItem('token');
    if (Notification.permission === 'granted' && storedAuthToken) {
      const syncToken = async () => {
        try {
          const fcmToken = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
          });
          if (fcmToken) {
            setToken(fcmToken);
            localStorage.setItem('fcm_token', fcmToken);
            // Save to backend silently
            await api.post('/device-tokens', {
              token: fcmToken,
              platform: 'web',
              device_name: navigator.userAgent
            });
          }
        } catch (err) {
          console.warn('Silent FCM token sync failed:', err);
        }
      };
      
      syncToken();
    }
  }, []);

  // Primary function to request permission and register token
  const requestAndRegister = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast.error('Notifications are not supported by this browser.');
      return;
    }

    if (!messaging) {
      toast.error('Firebase Messaging is not supported or failed to load.');
      return;
    }

    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        const fcmToken = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        });

        if (fcmToken) {
          setToken(fcmToken);
          localStorage.setItem('fcm_token', fcmToken);

          // Save token to backend database
          await api.post('/device-tokens', {
            token: fcmToken,
            platform: 'web',
            device_name: navigator.userAgent,
          });

          toast.success('Successfully subscribed to desktop notifications!');
        } else {
          toast.error('Unable to retrieve Firebase token.');
        }
      } else if (result === 'denied') {
        toast.error('Notification permission denied. Enable it in your browser settings.');
      }
    } catch (error) {
      console.error('Error during push notification setup:', error);
      toast.error(
        'Subscription failed: ' + (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  // Function to unregister/unsubscribe from push notifications
  const unregister = async () => {
    const activeFcmToken = localStorage.getItem('fcm_token') || token;
    if (!activeFcmToken) return;

    setLoading(true);
    try {
      // Delete token from backend
      await api.delete('/device-tokens', { data: { token: activeFcmToken } });
      
      localStorage.removeItem('fcm_token');
      setToken(null);
      toast.success('Successfully unsubscribed from notifications.');
    } catch (error) {
      console.error('Error during push notification cleanup:', error);
      toast.error(
        'Unsubscribe failed: ' + (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    permission,
    token,
    loading,
    requestAndRegister,
    unregister,
  };
};
