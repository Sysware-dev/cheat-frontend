import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import './index.css';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dlzpktmtxcbknpulwnzp.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsenBrdG10eGNia25wdWx3bnpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNzgyNjEsImV4cCI6MjA2OTc1NDI2MX0.0paajBHMgqsZHEfufMglEtyqGMDaJBDx2YBfvsR2p-M';
const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  const [user, setUser] = useState(null);
  const [cheats, setCheats] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [view, setView] = useState('store');
  const [error, setError] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  useEffect(() => {
    // Fetch cheats from Supabase
    const fetchCheats = async () => {
      try {
        const { data, error } = await supabase.from('cheats').select('*');
        if (error) {
          console.error('Error fetching cheats:', error);
          setError('Failed to load cheats: ' + error.message);
          return;
        }
        console.log('Fetched cheats:', data);
        setCheats(data || []);
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Unexpected error fetching cheats');
      }
    };
    fetchCheats();

    // Supabase auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        ensureUserExists(session.user);
        fetchOrders(session.user.id);
      } else {
        setOrders([]);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const ensureUserExists = async (user) => {
    try {
      // Check if user exists in our users table
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (checkError && checkError.code === 'PGRST116') {
        // User doesn't exist, create them
        const { error: insertError } = await supabase
          .from('users')
          .insert([{ id: user.id, firebase_uid: user.id }]);
        
        if (insertError) {
          console.error('Error creating user:', insertError);
          setError('Error creating user profile: ' + insertError.message);
        }
      } else if (checkError) {
        console.error('Error checking user:', checkError);
        setError('Error checking user profile: ' + checkError.message);
      }
    } catch (err) {
      console.error('Unexpected error ensuring user exists:', err);
      setError('Unexpected error creating user profile');
    }
  };

  const fetchOrders = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, licenses(key)')
        .eq('user_id', userId);
      if (error) {
        console.error('Error fetching orders:', error);
        setError('Failed to load orders: ' + error.message);
        return;
      }
      setOrders(data || []);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Unexpected error fetching orders');
    }
  };

  const handleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      alert('Login failed: ' + error.message);
      setError('Login failed: ' + error.message);
    }
  };

  const handleSignup = async () => {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      alert('Signup successful! Please check your email for verification.\n\n⚠️ ATTENTION: Check your Gmail spam folder if you don\'t see the email!');
    } catch (error) {
      alert('Signup failed: ' + error.message);
      setError('Signup failed: ' + error.message);
    }
  };

  const handleForgotPassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetMessage('Password reset email sent! Please check your inbox.\n\n⚠️ ATTENTION: Check your Gmail spam folder if you don\'t see the email!');
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error) {
      setError('Password reset failed: ' + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setCart([]);
      setOrders([]);
      setError(null);
    } catch (error) {
      setError('Logout failed: ' + error.message);
    }
  };

  const addToCart = (cheat) => {
    setCart([...cart, cheat]);
  };

  const placeOrder = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('orders')
        .insert([{ user_id: user.id, items: cart, status: 'pending' }]);
      if (error) throw error;
      alert('Order placed! Please send payment via Qpay or Khan Bank.');
      setCart([]);
    } catch (error) {
      alert('Error placing order: ' + error.message);
      setError('Error placing order: ' + error.message);
    }
  };

  const customCheat = cheats.find(cheat => cheat.id === 999);

  return (
    <div className="container mx-auto p-6 bg-background text-text min-h-screen">
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <nav className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary">Sysware Cheat Store</h1>
        <div className="flex gap-4">
          {user ? (
            <>
              <button onClick={() => setView('profile')} className="px-6 py-2 bg-primary text-background rounded-lg pulse-glow">
                Profile
              </button>
              <button onClick={handleLogout} className="px-6 py-2 bg-secondary text-background rounded-lg pulse-glow">
                Logout
              </button>
            </>
          ) : (
            <div className="flex gap-2 items-center">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="p-2 bg-card text-text rounded-lg border border-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="p-2 bg-card text-text rounded-lg border border-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button onClick={handleLogin} className="px-6 py-2 bg-primary text-background rounded-lg pulse-glow">
                Login
              </button>
              <button onClick={handleSignup} className="px-6 py-2 bg-primary text-background rounded-lg pulse-glow">
                Signup
              </button>
              <button 
                onClick={() => setShowForgotPassword(true)} 
                className="text-primary hover:text-secondary underline text-sm"
              >
                Forgot Password?
              </button>
            </div>
          )}
        </div>
      </nav>

      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg border border-primary max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-primary mb-4">Reset Password</h2>
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full p-2 bg-background text-text rounded-lg border border-primary focus:outline-none focus:ring-2 focus:ring-primary mb-4"
            />
            <div className="flex gap-2">
              <button onClick={handleForgotPassword} className="px-4 py-2 bg-primary text-background rounded-lg pulse-glow">
                Send Reset Email
              </button>
              <button 
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmail('');
                  setError(null);
                }} 
                className="px-4 py-2 bg-secondary text-background rounded-lg pulse-glow"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {resetMessage && (
        <div className="mb-4 p-4 bg-green-600 text-white rounded-lg">
          {resetMessage}
          <button 
            onClick={() => setResetMessage('')} 
            className="ml-2 text-white hover:text-gray-200"
          >
            ×
          </button>
        </div>
      )}

      {view === 'store' && (
        <div>
          {customCheat ? (
            <div className="mb-12 p-6 bg-card rounded-lg border border-primary shadow-lg">
              <h2 className="text-2xl font-bold text-primary mb-4">Featured: {customCheat.name}</h2>
              <p className="text-text mb-4">{customCheat.description}</p>
              <p className="text-lg font-semibold text-secondary mb-4">Price: ${customCheat.price}</p>
              <button
                onClick={() => addToCart(customCheat)}
                className="px-6 py-3 bg-primary text-background rounded-lg pulse-glow"
              >
                Add to Cart
              </button>
            </div>
          ) : (
            <p className="text-red-500">Custom cheat not found. Please check Supabase configuration.</p>
          )}
          <h2 className="text-2xl font-bold mb-4">All Cheats</h2>
          {cheats.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {cheats.map((cheat) => (
                <div key={cheat.id} className="p-6 bg-card rounded-lg border border-primary">
                  <h3 className="text-xl font-bold text-primary">{cheat.name}</h3>
                  <p className="text-text">{cheat.description}</p>
                  <p className="text-lg font-semibold text-secondary">Price: ${cheat.price}</p>
                  <button
                    onClick={() => addToCart(cheat)}
                    className="mt-4 px-6 py-2 bg-primary text-background rounded-lg pulse-glow"
                  >
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-red-500">No cheats available. Please check Supabase.</p>
          )}
          <div className="mt-8">
            <h2 className="text-2xl font-bold">Cart ({cart.length})</h2>
            {cart.map((item, index) => (
              <p key={index} className="text-text">
                {item.name} - ${item.price}
              </p>
            ))}
            {cart.length > 0 && (
              <button onClick={placeOrder} className="mt-4 px-6 py-2 bg-primary text-background rounded-lg pulse-glow">
                Place Order
              </button>
            )}
          </div>
        </div>
      )}

      {view === 'profile' && user && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Profile</h2>
          <p className="text-text">Email: {user.email}</p>
          <h3 className="text-xl font-bold mt-6">Order History</h3>
          {orders.map((order) => (
            <div key={order.id} className="p-4 bg-card rounded-lg mb-4 border border-primary">
              <p className="text-text">Order ID: {order.id}</p>
              <p className="text-text">Items: {order.items.map((item) => item.name).join(', ')}</p>
              <p className="text-text">Status: {order.status}</p>
              {order.status === 'approved' && (
                <p className="text-text">License Key: {order.licenses?.[0]?.key}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;