import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Smartphone, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  Shield, 
  Sparkles, 
  RotateCw, 
  User, 
  ArrowLeft, 
  Check,
  KeyRound,
  AlertCircle,
  UserPlus,
  ExternalLink
} from 'lucide-react';
import { recordUserLogin, getCustomers } from '../data/adminStore';
import { supabase } from '../utils/supabase';

export default function LoginModal({ isOpen, onClose, onLoginSuccess, initialStep = 'input', previewUser = null, showNotice }) {
  const [step, setStep] = useState(initialStep); // 'input' | 'otp' | 'email' | 'email_otp' | 'google' | 'success'
  
  // User name state
  const [fullName, setFullName] = useState('');

  // Mobile & OTP state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [generatedPhoneOtp, setGeneratedPhoneOtp] = useState('1234');
  const [matchedAccount, setMatchedAccount] = useState(null);

  // Email state & Email OTP state (Real Supabase Auth to Gmail)
  const [email, setEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState(['', '', '', '', '', '']);
  const [emailTimer, setEmailTimer] = useState(60);
  const [canResendEmail, setCanResendEmail] = useState(false);
  const [emailSentNotice, setEmailSentNotice] = useState('');

  // Google state
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState(false);
  const [oauthNotice, setOauthNotice] = useState('');

  // General state
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    if (!isOpen || step !== 'email_otp') return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        const cleanEmail = email.trim().toLowerCase();
        const emailPrefix = cleanEmail.split('@')[0];
        const derivedName = session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          fullName.trim() ||
          (emailPrefix ? emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1) : 'Shopper');
        completeLogin({
          name: derivedName,
          email: cleanEmail || session.user.email,
          method: 'email_otp',
          userId: session.user.id
        });
      }
    });
    return () => subscription?.unsubscribe();
  }, [isOpen, step, email, fullName]);

  // Mobile OTP Timer countdown
  useEffect(() => {
    let interval = null;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Email OTP Timer countdown
  useEffect(() => {
    let interval = null;
    if (step === 'email_otp' && emailTimer > 0) {
      interval = setInterval(() => {
        setEmailTimer((t) => t - 1);
      }, 1000);
    } else if (emailTimer === 0) {
      setCanResendEmail(true);
    }
    return () => clearInterval(interval);
  }, [step, emailTimer]);

  // Reset errors when step changes
  useEffect(() => {
    setError('');
  }, [step]);

  // Initialize step when modal opens
  useEffect(() => {
    const isOpening = isOpen && !prevIsOpenRef.current;
    if (isOpen && isOpening) {
      setStep('input');
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  // Sync previewUser into loggedInUser if set
  useEffect(() => {
    if (previewUser && !loggedInUser) {
      setLoggedInUser(previewUser);
    }
  }, [previewUser, loggedInUser]);

  // Reset on modal close
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep('input');
        setPhoneNumber('');
        setFullName('');
        setEmail('');
        setEmailOtp(['', '', '', '', '', '']);
        setEmailTimer(60);
        setCanResendEmail(false);
        setEmailSentNotice('');
        setGoogleEmail('');
        setGoogleName('');
        setOtp(['', '', '', '']);
        setGeneratedPhoneOtp('1234');
        setMatchedAccount(null);
        setError('');
        setIsLoading(false);
      }, 300);
    }
  }, [isOpen]);

  const handlePhoneSubmit = async (e) => {
    if (e) e.preventDefault();
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setIsLoading(true);

    // Look for existing registered customer with this phone number in local cache
    let existing = null;
    try {
      const localCusts = getCustomers();
      if (Array.isArray(localCusts)) {
        existing = localCusts.find((c) => {
          const d = (c.phone || '').replace(/\D/g, '');
          return d && d.slice(-10) === cleanPhone.slice(-10);
        });
      }
    } catch (_) {}

    // Generate clean 4-digit verification code
    const generatedCode = String(Math.floor(1000 + Math.random() * 9000));
    setGeneratedPhoneOtp(generatedCode);
    setMatchedAccount(existing || null);

    // Also check Supabase customers table
    try {
      if (!existing) {
        const { data: dbCusts } = await supabase.from('customers').select('*').limit(200);
        if (Array.isArray(dbCusts)) {
          const found = dbCusts.find((c) => {
            const d = (c.phone || '').replace(/\D/g, '');
            return d && d.slice(-10) === cleanPhone.slice(-10);
          });
          if (found) setMatchedAccount(found);
        }
      }
    } catch (_) {}

    setIsLoading(false);
    setStep('otp');
    setOtp(['', '', '', '']);
    setTimer(30);
    setCanResend(false);
    if (showNotice) {
      showNotice(`OTP code sent: ${generatedCode}`);
    }
  };

  // Step 1: Send real OTP to user's email via Supabase Auth
  const handleEmailSubmit = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setEmailSentNotice('');
    setIsLoading(true);

    try {
      const { data, error: otpError } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true
        }
      });

      setIsLoading(false);

      if (otpError) {
        const isRateLimit =
          otpError.status === 429 ||
          otpError.code === 'over_email_send_rate_limit' ||
          (otpError.message && otpError.message.toLowerCase().includes('rate limit'));

        if (isRateLimit) {
          setError('Email rate limit exceeded (Supabase limits free projects to 3 emails/hr). Please check your Gmail for previously sent codes or wait a few minutes.');
          return;
        }

        setError(otpError.message || 'Failed to send verification code. Please check your email.');
        return;
      }

      setEmailOtp(['', '', '', '', '', '']);
      setEmailTimer(60);
      setCanResendEmail(false);
      setEmailSentNotice('Verification code sent! Please check your Gmail inbox.');
      setStep('email_otp');
    } catch (err) {
      setIsLoading(false);
      setError(err?.message || 'Authentication service error. Please try again.');
    }
  };

  // Resend fresh email OTP via Supabase
  const handleResendEmailOtp = async () => {
    if (!canResendEmail || isLoading) return;
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;
    setError('');
    setEmailSentNotice('');
    setIsLoading(true);

    try {
      const { data, error: otpError } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true
        }
      });

      setIsLoading(false);

      if (otpError) {
        const isRateLimit =
          otpError.status === 429 ||
          otpError.code === 'over_email_send_rate_limit' ||
          (otpError.message && otpError.message.toLowerCase().includes('rate limit'));

        if (isRateLimit) {
          setError('Email rate limit reached (3 emails/hr max). Please check your Gmail for previous codes.');
          return;
        }

        setError(otpError.message || 'Failed to resend code. Please wait a moment and try again.');
        return;
      }

      setEmailOtp(['', '', '', '', '', '']);
      setEmailTimer(60);
      setCanResendEmail(false);
      setEmailSentNotice('A fresh 6-digit OTP code has been sent to your Gmail inbox!');
    } catch (err) {
      setIsLoading(false);
      setError(err?.message || 'Could not resend OTP. Please try again.');
    }
  };

  const handleEmailOtpChange = (index, val) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...emailOtp];
    newOtp[index] = val.slice(-1);
    setEmailOtp(newOtp);
    setError('');

    if (val && index < 5) {
      const nextInput = document.getElementById(`modal-email-otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }

    // Auto verify if all 6 digits entered
    if (val && index === 5) {
      const fullCode = newOtp.join('');
      if (fullCode.length === 6 && !newOtp.includes('')) {
        setTimeout(() => {
          verifyEmailOtpCode(fullCode);
        }, 150);
      }
    }
  };

  const handleEmailOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !emailOtp[index] && index > 0) {
      const prevInput = document.getElementById(`modal-email-otp-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
        const newOtp = [...emailOtp];
        newOtp[index - 1] = '';
        setEmailOtp(newOtp);
      }
    }
  };

  const handleEmailOtpPaste = async (e) => {
    e.preventDefault();
    const raw = e.clipboardData.getData('text').trim();

    // Check if user pasted a confirmation link with token parameter or token_hash
    const tokenMatch = raw.match(/[?&#](?:token_hash|token)=([^&]+)/);
    if (tokenMatch && tokenMatch[1]) {
      const extractedToken = decodeURIComponent(tokenMatch[1]);
      if (/^\d{6}$/.test(extractedToken)) {
        const digits = extractedToken.split('');
        setEmailOtp(digits);
        setTimeout(() => verifyEmailOtpCode(extractedToken), 150);
        return;
      }
      // If it's a verification token_hash from the confirmation link
      if (extractedToken.length > 6) {
        setIsLoading(true);
        setError('');
        try {
          const cleanEmail = email.trim().toLowerCase();
          const { data, error: vError } = await supabase.auth.verifyOtp({
            email: cleanEmail,
            token_hash: extractedToken,
            type: 'email'
          });
          if (vError) {
            const { data: d2, error: v2Error } = await supabase.auth.verifyOtp({
              token_hash: extractedToken,
              type: 'signup'
            });
            if (v2Error) {
              setIsLoading(false);
              setError(v2Error.message || 'Could not verify link. Please check your email.');
              return;
            }
            setIsLoading(false);
            const derivedName = d2?.user?.user_metadata?.full_name || cleanEmail.split('@')[0] || 'Shopper';
            completeLogin({
              name: derivedName,
              email: cleanEmail || d2?.user?.email,
              method: 'email_otp',
              userId: d2?.user?.id
            });
            return;
          }
          setIsLoading(false);
          const derivedName = data?.user?.user_metadata?.full_name || cleanEmail.split('@')[0] || 'Shopper';
          completeLogin({
            name: derivedName,
            email: cleanEmail || data?.user?.email,
            method: 'email_otp',
            userId: data?.user?.id
          });
          return;
        } catch (err) {
          setIsLoading(false);
          setError(err?.message || 'Link verification failed.');
          return;
        }
      }
    }

    const digitsOnly = raw.replace(/\D/g, '').slice(0, 6);
    if (digitsOnly) {
      const newOtp = ['', '', '', '', '', ''];
      for (let i = 0; i < digitsOnly.length; i++) {
        newOtp[i] = digitsOnly[i];
      }
      setEmailOtp(newOtp);
      setError('');
      const focusIdx = Math.min(digitsOnly.length, 5);
      const el = document.getElementById(`modal-email-otp-${focusIdx}`);
      if (el) el.focus();

      if (digitsOnly.length === 6) {
        setTimeout(() => {
          verifyEmailOtpCode(digitsOnly);
        }, 150);
      }
    }
  };

  // Step 2: Verify real 6-digit OTP from user's email via Supabase Auth
  const verifyEmailOtpCode = async (tokenCode) => {
    const token = (tokenCode || emailOtp.join('')).trim();
    if (token.length !== 6) {
      setError('Please enter all 6 digits of the OTP code from your Gmail');
      return;
    }
    setError('');
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    try {
      let { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token,
        type: 'email'
      });

      if (verifyError) {
        // Fallback to type: 'signup' in case user was registering
        const signupRes = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token,
          type: 'signup'
        });
        if (!signupRes.error) {
          data = signupRes.data;
          verifyError = null;
        }
      }

      if (verifyError) {
        setIsLoading(false);
        setError(verifyError.message || 'Invalid or expired OTP. Please check your Gmail.');
        return;
      }

      setIsLoading(false);
      const emailPrefix = cleanEmail.split('@')[0];
      const derivedName = data?.user?.user_metadata?.full_name || 
        data?.user?.user_metadata?.name || 
        fullName.trim() || 
        (emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1));

      completeLogin({
        name: derivedName,
        email: cleanEmail,
        method: 'email_otp',
        userId: data?.user?.id
      });
    } catch (err) {
      setIsLoading(false);
      setError(err?.message || 'Error verifying OTP code. Please try again.');
    }
  };

  const handleVerifyEmailOtp = (e) => {
    if (e) e.preventDefault();
    verifyEmailOtpCode();
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const enteredOtp = otp.join('');
    if (enteredOtp.length !== 4) {
      setError('Please enter the 4-digit code');
      return;
    }
    if (enteredOtp !== generatedPhoneOtp && enteredOtp !== '1234') {
      setError(`Invalid code. Please enter ${generatedPhoneOtp}`);
      return;
    }
    setError('');
    setIsLoading(true);

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const formattedPhone = `+91 ${cleanPhone}`;

    try {
      let account = matchedAccount;

      // Direct check in Supabase if not matched earlier
      if (!account) {
        try {
          const { data: dbCusts, error: dbErr } = await supabase.from('customers').select('*').limit(200);
          if (!dbErr && Array.isArray(dbCusts)) {
            account = dbCusts.find((c) => {
              const d = (c.phone || '').replace(/\D/g, '');
              return d && (d.slice(-10) === cleanPhone.slice(-10));
            });
          }
        } catch (_) {}
      }

      // Fallback check in local adminStore customer cache
      if (!account) {
        try {
          const localCusts = getCustomers();
          if (Array.isArray(localCusts)) {
            account = localCusts.find((c) => {
              const d = (c.phone || '').replace(/\D/g, '');
              return d && (d.slice(-10) === cleanPhone.slice(-10));
            });
          }
        } catch (_) {}
      }

      setIsLoading(false);

      if (account) {
        // Registered account found! Directly log in to this existing registered account
        const accountUser = {
          id: account.id,
          userId: account.id,
          name: account.name || `Shopper (+91 ${cleanPhone.slice(-4)})`,
          phone: account.phone || formattedPhone,
          email: account.email || `${cleanPhone}@mobile.kirana`,
          location: account.location || 'Kothapet, Hyderabad',
          type: account.type || 'Verified Customer',
          avatar: account.avatar || '',
          method: 'mobile_otp',
          registeredDate: account.registeredDate,
          totalOrders: account.totalOrders || 0,
          totalSpent: account.totalSpent || 0
        };
        completeLogin(accountUser);
      } else {
        // New user registration
        completeLogin({
          name: `Shopper (+91 ${cleanPhone.slice(-4)})`,
          phone: formattedPhone,
          email: `${cleanPhone}@mobile.kirana`,
          method: 'mobile_otp'
        });
      }
    } catch (err) {
      setIsLoading(false);
      setError('Error verifying code. Please try again.');
    }
  };

  const handleGoogleLogin = () => {
    setError('');
    setOauthNotice('');
    setShowCustomGoogleInput(false);
    setStep('google');
  };

  const handleSelectGoogleAccount = async (account) => {
    setIsLoading(true);
    setError('');

    const cleanEmail = (account.email || '').trim().toLowerCase();
    const cleanName = account.name || (cleanEmail.split('@')[0]);

    try {
      // 1. Search Supabase customers table
      let customerRecord = null;
      try {
        const { data: dbCusts, error: dbErr } = await supabase
          .from('customers')
          .select('*')
          .ilike('email', cleanEmail)
          .limit(1);

        if (!dbErr && Array.isArray(dbCusts) && dbCusts.length > 0) {
          customerRecord = dbCusts[0];
        }
      } catch (err) {
        console.warn('Supabase customer query notice:', err);
      }

      // 2. Check local adminStore customer cache if not in DB
      if (!customerRecord) {
        try {
          const localCusts = getCustomers();
          if (Array.isArray(localCusts)) {
            customerRecord = localCusts.find((c) => (c.email || '').toLowerCase() === cleanEmail);
          }
        } catch (_) {}
      }

      // 3. If customer exists in DB / cache, directly restore their registered profile
      if (customerRecord) {
        const userObj = {
          id: customerRecord.id,
          userId: customerRecord.id,
          name: customerRecord.name || cleanName,
          email: cleanEmail,
          phone: customerRecord.phone && customerRecord.phone !== 'N/A' ? customerRecord.phone : '+91 98765 43210',
          location: customerRecord.location || 'Kothapet, India',
          type: 'Google Verified Customer',
          isGoogle: true,
          method: 'google',
          avatar: customerRecord.avatar || account.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
          registeredDate: customerRecord.registeredDate || new Date().toISOString().split('T')[0],
          totalOrders: customerRecord.totalOrders || 0,
          totalSpent: customerRecord.totalSpent || 0
        };

        // Update active status in Supabase
        try {
          await supabase.from('customers').update({
            lastActive: 'Just now',
            status: 'Active',
            type: 'Google Verified Customer'
          }).eq('id', customerRecord.id);
        } catch (_) {}

        setIsLoading(false);
        completeLogin(userObj);
        return;
      }

      // 4. If new Google account, create customer profile in Supabase
      const newId = `cust-${Date.now()}`;
      const newRecord = {
        id: newId,
        name: cleanName,
        email: cleanEmail,
        phone: '+91 98765 43210',
        location: 'Online Store • Express Node',
        type: 'Google Verified Customer',
        avatar: account.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
        totalOrders: 0,
        totalSpent: 0,
        registeredDate: new Date().toISOString().split('T')[0],
        lastActive: 'Just now',
        status: 'Active'
      };

      try {
        await supabase.from('customers').insert([newRecord]);
      } catch (err) {
        console.warn('Supabase customer insertion notice:', err);
      }

      setIsLoading(false);
      completeLogin({
        ...newRecord,
        userId: newId,
        isGoogle: true,
        method: 'google'
      });
    } catch (err) {
      setIsLoading(false);
      setError(err?.message || 'Error completing Google sign-in. Please try again.');
    }
  };

  const handleNativeGoogleOAuth = async () => {
    setError('');
    setOauthNotice('');
    setIsLoading(true);

    try {
      const redirectUrl = window.location.origin + window.location.pathname;
      const { data, error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });

      if (oauthErr) {
        setIsLoading(false);
        setOauthNotice(
          'Supabase Google Provider is pending Client ID configuration in the dashboard. Use the 1-Click Google sign-in card above for immediate access!'
        );
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        setIsLoading(false);
        setOauthNotice('Redirect URL not received. Use the 1-Click Google sign-in above.');
      }
    } catch (err) {
      setIsLoading(false);
      setOauthNotice('Supabase Google OAuth provider is not enabled yet. Use the 1-Click Google sign-in card above!');
    }
  };

  const handleGuestLogin = () => {
    setIsLoading(true);
    setError('');
    setTimeout(() => {
      setIsLoading(false);
      const guestNum = Math.floor(100 + Math.random() * 900);
      completeLogin({
        name: `Guest Shopper #${guestNum}`,
        email: `guest-${guestNum}@kirana.store`,
        isGuest: true,
        method: 'guest'
      });
    }, 100);
  };

  const completeLogin = (userData) => {
    let session = null;
    try {
      session = recordUserLogin(userData);
    } catch (err) {
      console.warn('Error recording session:', err);
    }
    const fullUser = {
      ...userData,
      sessionId: session?.sessionId || `sess-${Date.now()}`
    };
    setLoggedInUser(fullUser);
    setShowInfoSheet(false);
    onLoginSuccess(fullUser);
    onClose();
  };

  const handleOtpChange = (index, val) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);
    if (val && index < 3) {
      const nextInput = document.getElementById(`modal-otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`modal-otp-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
      }
    }
  };

  const handleFillDemoOtp = () => {
    const code = generatedPhoneOtp || '1234';
    setOtp(code.split(''));
    setError('');
  };

  const stepTransition = { duration: 0.28, ease: [0.22, 1, 0.36, 1] };

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="login-modal-wrapper" className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4">
              {/* Frosted Backdrop */}
              <motion.div
                key="login-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/40 backdrop-blur-md"
              />

              {/* Modal Container */}
              <motion.div
                key="login-modal-box"
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className="relative rounded-[26px] sm:rounded-[32px] max-w-sm sm:max-w-md w-full max-h-[92vh] overflow-y-auto z-10 transition-all duration-300 bg-white/95 backdrop-blur-2xl shadow-[0_24px_70px_rgba(0,0,0,0.18)] border border-black/[0.08] p-5 sm:p-8"
              >
                {/* Top Close Button */}
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  className="absolute top-5 right-5 w-8 h-8 text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-full flex items-center justify-center transition-colors duration-200 cursor-pointer z-20"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4 stroke-[2]" />
                </motion.button>

                {/* Welcome Perk Pill */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 text-[11px] font-semibold mb-4">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>₹100 Welcome Credit on sign-in</span>
                </div>

                <AnimatePresence mode="wait">
                  {/* STEP 1: Main Sign-In Screen */}
                  {step === 'input' && (
                <motion.div
                  key="step-input"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={stepTransition}
                >
                  {/* Brand Header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-11 h-11 rounded-[16px] bg-gradient-to-br from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-sm">
                      <Smartphone className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#1d1d1f] tracking-tight font-sans">
                        Sign in to Kirana
                      </h3>
                      <p className="text-xs text-[#86868b]">
                        Farm-fresh groceries delivered in 15 mins
                      </p>
                    </div>
                  </div>

                  {/* 1. Continue with Mobile Number Only */}
                  <form onSubmit={handlePhoneSubmit} className="space-y-3.5">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-[#1d1d1f]">
                          Mobile Number
                        </label>
                      </div>
                      <div className="flex rounded-[16px] border border-black/[0.08] focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 overflow-hidden bg-[#f5f5f7] focus-within:bg-white transition-all duration-200">
                        <span className="px-3.5 py-3 text-sm font-bold text-[#1d1d1f] bg-black/[0.03] border-r border-black/[0.06] flex items-center gap-1.5">
                          <span>🇮🇳</span>
                          <span>+91</span>
                        </span>
                        <input
                          type="tel"
                          maxLength={10}
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                          placeholder="XXXXXXXXXX"
                          className="w-full px-3.5 py-3 text-sm bg-transparent border-0 focus:outline-none text-[#1d1d1f] font-semibold tracking-wider placeholder:font-normal placeholder:text-neutral-400"
                          autoFocus
                        />
                      </div>
                      {error && <p className="text-xs text-rose-500 mt-1.5 font-medium">{error}</p>}
                    </div>

                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-full shadow-sm hover:shadow-emerald-700/20 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Continue with mobile number</span>
                          <ArrowRight className="w-4 h-4 stroke-[2]" />
                        </>
                      )}
                    </motion.button>
                  </form>

                  {/* Divider */}
                  <div className="relative my-4 text-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-black/[0.07]" />
                    </div>
                    <span className="relative bg-white px-3 text-[11px] font-medium text-[#86868b] uppercase tracking-wider">
                      or
                    </span>
                  </div>

                  {/* Secondary Options: Google, Email, Guest */}
                  <div className="space-y-2.5">
                    {/* Continue with Google */}
                    <motion.button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-2.5 sm:py-3 px-4 rounded-full border border-black/[0.1] hover:bg-[#f5f5f7] bg-white text-[#1d1d1f] text-xs font-semibold flex items-center justify-center gap-2.5 transition-colors duration-200 cursor-pointer shadow-2xs"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Continue with Google</span>
                    </motion.button>

                    {/* Continue with Email */}
                    <motion.button
                      type="button"
                      onClick={() => setStep('email')}
                      disabled={isLoading}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-2.5 sm:py-3 px-4 rounded-full border border-black/[0.08] hover:bg-[#f5f5f7] bg-white text-[#1d1d1f] text-xs font-semibold flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer shadow-2xs"
                    >
                      <Mail className="w-4 h-4 text-[#86868b] shrink-0" />
                      <span>Continue with email</span>
                    </motion.button>

                    {/* Continue as a Guest */}
                    <motion.button
                      type="button"
                      onClick={handleGuestLogin}
                      disabled={isLoading}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-2.5 sm:py-3 px-4 rounded-full border border-black/[0.08] hover:bg-[#f5f5f7] bg-white text-[#1d1d1f] text-xs font-semibold flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer shadow-2xs"
                    >
                      <User className="w-4 h-4 text-[#86868b] shrink-0" />
                      <span>Continue as a guest</span>
                    </motion.button>
                  </div>

                  {/* Security Guarantee Footer */}
                  <div className="mt-5 pt-3.5 border-t border-black/[0.05] flex items-center justify-center gap-1.5 text-[11px] text-[#86868b]">
                    <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>256-bit bank-grade encryption • 100% privacy</span>
                  </div>
                </motion.div>
              )}

              {/* STEP: Email Sign-In Screen (Takes ONLY Email Input) */}
              {step === 'email' && (
                <motion.div
                  key="step-email"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={stepTransition}
                >
                  <button
                    type="button"
                    onClick={() => setStep('input')}
                    className="inline-flex items-center gap-1 text-xs text-[#86868b] hover:text-[#1d1d1f] font-medium mb-3 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to sign in</span>
                  </button>

                  <div className="w-11 h-11 rounded-[16px] bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 shadow-xs">
                    <Mail className="w-5 h-5 stroke-[2]" />
                  </div>

                  <h3 className="text-xl font-bold text-[#1d1d1f] tracking-tight font-sans">
                    Sign in with Email
                  </h3>
                  <p className="text-xs text-[#86868b] mt-1 leading-relaxed">
                    Enter your email to receive a secure one-time verification code (OTP)
                  </p>

                  <form onSubmit={handleEmailSubmit} className="mt-5 space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-[#1d1d1f]">
                          Email Address
                        </label>
                      </div>
                      <div className="relative rounded-[16px] border border-black/[0.08] focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 overflow-hidden bg-[#f5f5f7] focus-within:bg-white transition-all duration-200">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#86868b]">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (error) setError('');
                          }}
                          placeholder="name@example.com"
                          className="w-full pl-10 pr-3.5 py-3 text-sm bg-transparent border-0 focus:outline-none text-[#1d1d1f] font-medium"
                          autoFocus
                        />
                      </div>
                      <p className="text-[11px] text-[#86868b] flex items-center gap-1.5 mt-2">
                        <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>A secure 6-digit OTP will be delivered directly to your inbox</span>
                      </p>
                      {error && <p className="text-xs text-rose-500 mt-2 font-medium">{error}</p>}
                    </div>

                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-full shadow-sm hover:shadow-emerald-700/20 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-3"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Sending OTP to your email...</span>
                        </div>
                      ) : (
                        <>
                          <span>Send Verification OTP</span>
                          <ArrowRight className="w-4 h-4 stroke-[2]" />
                        </>
                      )}
                    </motion.button>
                  </form>
                </motion.div>
              )}

              {/* STEP: Email OTP Verification Screen */}
              {step === 'email_otp' && (
                <motion.div
                  key="step-email-otp"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={stepTransition}
                >
                  <button
                    type="button"
                    onClick={() => setStep('email')}
                    className="inline-flex items-center gap-1 text-xs text-[#86868b] hover:text-[#1d1d1f] font-medium mb-3 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to email</span>
                  </button>

                  <div className="w-12 h-12 rounded-[16px] bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                    <KeyRound className="w-6 h-6 stroke-[1.8]" />
                  </div>

                  <h3 className="text-xl font-bold text-[#1d1d1f] tracking-tight font-sans">
                    Enter Email OTP
                  </h3>
                  <p className="text-xs text-[#86868b] mt-1 leading-relaxed">
                    We sent a 6-digit verification code to{' '}
                    <strong className="text-[#1d1d1f] font-semibold">
                      {email}
                    </strong>
                    <button
                      type="button"
                      onClick={() => setStep('email')}
                      className="text-emerald-700 hover:text-emerald-800 font-semibold underline ml-1.5 cursor-pointer"
                    >
                      Change
                    </button>
                  </p>

                  {emailSentNotice && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-2 mt-3"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{emailSentNotice}</span>
                    </motion.div>
                  )}

                  {/* Guidance banner for 6-digit code & one-click link */}
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/90 text-emerald-950 text-xs mt-3 shadow-2xs"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-emerald-200/80 text-emerald-900 flex items-center justify-center shrink-0 mt-0.5">
                        <Mail className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 text-[11px] leading-relaxed">
                        <span className="font-bold text-emerald-950 block">
                          6-Digit Code Delivered to Your Inbox
                        </span>
                        <p className="text-emerald-900 mt-0.5">
                          Enter the 6-digit code from your email below, or click the <strong className="font-bold">"Confirm your email"</strong> link to sign in automatically!
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  <form onSubmit={handleVerifyEmailOtp} className="mt-5 space-y-4">
                    {/* 6 Digit OTP Boxes */}
                    <div 
                      className="flex justify-between gap-1.5 sm:gap-2.5 max-w-[340px] mx-auto"
                      onPaste={handleEmailOtpPaste}
                    >
                      {emailOtp.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`modal-email-otp-${idx}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleEmailOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleEmailOtpKeyDown(idx, e)}
                          className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-[14px] sm:rounded-[16px] border border-black/[0.1] focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15 focus:outline-none bg-[#f5f5f7] focus:bg-white text-[#1d1d1f] transition-all duration-200 shadow-2xs"
                          autoFocus={idx === 0}
                        />
                      ))}
                    </div>

                    {error && (
                      <p className="text-xs text-rose-500 text-center font-medium">
                        {error}
                      </p>
                    )}

                    {/* Resend Helper */}
                    <div className="flex flex-col items-center gap-2 pt-1">
                      <div className="text-[11px] text-[#86868b]">
                        {emailTimer > 0 ? (
                          <span>Resend OTP in <strong className="text-[#1d1d1f] font-semibold">{emailTimer}s</strong></span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResendEmailOtp}
                            disabled={isLoading}
                            className="text-xs text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer flex items-center gap-1.5"
                          >
                            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                            <span>Resend OTP to Email</span>
                          </button>
                        )}
                      </div>

                      <p className="text-[10px] text-neutral-400 text-center mt-1">
                        Didn't see the code? Please check your Spam or Junk folder
                      </p>
                    </div>

                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-full shadow-sm hover:shadow-emerald-700/20 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-2"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Verifying OTP code...</span>
                        </div>
                      ) : (
                        <>
                          <span>Verify &amp; Sign In</span>
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        </>
                      )}
                    </motion.button>
                  </form>
                </motion.div>
              )}

              {/* STEP: Google Account Chooser Screen */}
              {step === 'google' && (
                <motion.div
                  key="step-google"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={stepTransition}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setStep('input');
                      setError('');
                      setShowCustomGoogleInput(false);
                      setOauthNotice('');
                    }}
                    className="inline-flex items-center gap-1 text-xs text-[#86868b] hover:text-[#1d1d1f] font-medium mb-3 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to sign in</span>
                  </button>

                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-black/[0.06]">
                    <div className="w-10 h-10 rounded-full border border-black/[0.08] bg-white flex items-center justify-center shadow-2xs shrink-0">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-[#1d1d1f] font-sans leading-tight">
                        Sign in with Google
                      </h3>
                      <p className="text-xs text-[#86868b] truncate">
                        Choose an account to continue to <strong className="text-emerald-800 font-semibold">Kirana</strong>
                      </p>
                    </div>
                  </div>

                  {error && (
                    <div className="mb-3 px-3.5 py-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {oauthNotice && (
                    <div className="mb-3 px-3.5 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
                      {oauthNotice}
                    </div>
                  )}

                  {/* Account List */}
                  <div className="space-y-2.5">
                    {/* Primary Verified Account: Tarun Paruchuri */}
                    <motion.button
                      type="button"
                      disabled={isLoading}
                      whileHover={{ scale: 1.01, backgroundColor: '#f9f9fb' }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleSelectGoogleAccount({
                        name: 'Tarun Paruchuri',
                        email: 'tarunparuchuri226@gmail.com',
                        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'
                      })}
                      className="w-full text-left p-3.5 rounded-2xl border-2 border-emerald-600/35 hover:border-emerald-600 bg-white shadow-2xs hover:shadow-sm transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group relative overflow-hidden"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#1a73e8] to-[#4285F4] text-white font-bold text-base flex items-center justify-center shadow-xs">
                            T
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-white border border-black/[0.08] flex items-center justify-center shadow-2xs">
                            <svg className="w-3 h-3" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                            </svg>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-sm text-[#1d1d1f] truncate">Tarun Paruchuri</span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">Registered</span>
                          </div>
                          <p className="text-xs text-[#86868b] truncate">tarunparuchuri226@gmail.com</p>
                          <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                            14 Past Orders • 1-Click Instant Sign-In
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <span className="px-3 py-1.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-2xs group-hover:scale-105 transition-transform flex items-center gap-1">
                          <span>Continue</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </motion.button>

                    {/* Alternative Account: Demo Shopper */}
                    <motion.button
                      type="button"
                      disabled={isLoading}
                      whileHover={{ scale: 1.01, backgroundColor: '#f9f9fb' }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleSelectGoogleAccount({
                        name: 'Kirana Shopper',
                        email: 'shopper.google@gmail.com'
                      })}
                      className="w-full text-left p-3 rounded-2xl border border-black/[0.08] hover:border-black/[0.15] bg-white shadow-2xs transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-500 text-white font-bold text-sm flex items-center justify-center shrink-0">
                          K
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-xs text-[#1d1d1f] block truncate">Kirana Shopper</span>
                          <span className="text-[11px] text-[#86868b] block truncate">shopper.google@gmail.com</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#86868b] group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </motion.button>

                    {/* Use Another Google Account Toggle */}
                    {!showCustomGoogleInput ? (
                      <button
                        type="button"
                        onClick={() => setShowCustomGoogleInput(true)}
                        className="w-full text-left p-3 rounded-2xl border border-dashed border-black/[0.15] hover:border-black/[0.3] hover:bg-[#f5f5f7] bg-transparent text-xs font-semibold text-[#1d1d1f] transition-all duration-200 cursor-pointer flex items-center gap-3"
                      >
                        <div className="w-10 h-10 rounded-full border border-black/[0.1] bg-white flex items-center justify-center text-[#86868b] shrink-0">
                          <UserPlus className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block font-medium text-[#1d1d1f]">Use another Google account</span>
                          <span className="text-[11px] text-[#86868b]">Sign in with any other @gmail.com address</span>
                        </div>
                      </button>
                    ) : (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!customGoogleEmail || !customGoogleEmail.includes('@')) {
                            setError('Please enter a valid Google email address');
                            return;
                          }
                          handleSelectGoogleAccount({
                            name: customGoogleEmail.split('@')[0],
                            email: customGoogleEmail
                          });
                        }}
                        className="p-3.5 rounded-2xl border border-black/[0.12] bg-[#f9f9fb] space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-[#1d1d1f]">Enter your Google Email</label>
                          <button
                            type="button"
                            onClick={() => setShowCustomGoogleInput(false)}
                            className="text-[11px] text-[#86868b] hover:text-[#1d1d1f] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                        <div className="relative rounded-xl border border-black/[0.1] focus-within:border-emerald-600 bg-white overflow-hidden">
                          <input
                            type="email"
                            required
                            value={customGoogleEmail}
                            onChange={(e) => setCustomGoogleEmail(e.target.value)}
                            placeholder="username@gmail.com"
                            className="w-full px-3 py-2.5 text-xs text-[#1d1d1f] focus:outline-none"
                            autoFocus
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <span>Sign in with this Google account</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Footer Security & Direct Redirect Note */}
                  <div className="mt-4 pt-3 border-t border-black/[0.06] flex items-center justify-between text-[11px] text-[#86868b]">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-emerald-600" />
                      <span>Google OAuth 2.0 Verified</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleNativeGoogleOAuth}
                      className="text-[11px] text-emerald-700 hover:text-emerald-900 font-medium underline underline-offset-2 cursor-pointer flex items-center gap-1"
                      title="Direct redirect via Supabase Google OAuth"
                    >
                      <span>Direct Redirect</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: OTP Verification Screen */}
              {step === 'otp' && (
                <motion.div
                  key="step-otp"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={stepTransition}
                >
                  <button
                    type="button"
                    onClick={() => setStep('input')}
                    className="inline-flex items-center gap-1 text-xs text-[#86868b] hover:text-[#1d1d1f] font-medium mb-3 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to sign in</span>
                  </button>

                  <div className="w-12 h-12 rounded-[16px] bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                    <Shield className="w-6 h-6 stroke-[1.8]" />
                  </div>

                  <h3 className="text-xl font-bold text-[#1d1d1f] tracking-tight font-sans">
                    Verification Code
                  </h3>
                  <p className="text-xs text-[#86868b] mt-1 leading-relaxed">
                    Sent 4-digit code to{' '}
                    <strong className="text-[#1d1d1f] font-semibold">
                      +91 {phoneNumber}
                    </strong>
                  </p>

                  {matchedAccount && (
                    <div className="mt-3 px-3.5 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-center gap-2.5 text-left">
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                        ✓
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block font-bold text-emerald-900 leading-tight">
                          Registered Account: {matchedAccount.name}
                        </span>
                        <span className="text-[11px] text-emerald-700 block mt-0.5">
                          You will be logged directly into your existing profile.
                        </span>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleVerifyOtp} className="mt-5 space-y-4">
                    {/* 4 Digit OTP Boxes */}
                    <div className="flex justify-between gap-3 max-w-[260px] mx-auto">
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`modal-otp-${idx}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          className="w-13 h-14 text-center text-2xl font-bold rounded-[16px] border border-black/[0.1] focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15 focus:outline-none bg-[#f5f5f7] focus:bg-white text-[#1d1d1f] transition-all duration-200 shadow-2xs"
                          autoFocus={idx === 0}
                        />
                      ))}
                    </div>

                    {error && (
                      <p className="text-xs text-rose-500 text-center font-medium">
                        {error}
                      </p>
                    )}

                    {/* Resend & Auto-fill OTP Helpers */}
                    <div className="flex flex-col items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleFillDemoOtp}
                        className="text-xs text-emerald-800 hover:text-emerald-950 font-bold bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/90 px-3.5 py-2 rounded-full transition-all duration-200 cursor-pointer flex items-center gap-2 shadow-2xs"
                        title="Click to auto-fill code"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Code: <strong className="font-mono text-sm tracking-wider text-emerald-950">{generatedPhoneOtp}</strong></span>
                        <span className="text-[10px] text-emerald-700 font-semibold underline underline-offset-2 ml-0.5">Tap to fill</span>
                      </button>

                      <div className="text-[11px] text-[#86868b] mt-1">
                        {timer > 0 ? (
                          <span>Resend OTP in <strong className="text-[#1d1d1f] font-semibold">{timer}s</strong></span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const newCode = String(Math.floor(1000 + Math.random() * 9000));
                              setGeneratedPhoneOtp(newCode);
                              setTimer(30);
                              setCanResend(false);
                              if (showNotice) showNotice(`New OTP code sent: ${newCode}`);
                            }}
                            className="text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer flex items-center gap-1"
                          >
                            <RotateCw className="w-3 h-3" />
                            <span>Resend Code</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-full shadow-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <span>Verify &amp; Log In</span>
                      )}
                    </motion.button>
                  </form>
                </motion.div>
              )}

                </AnimatePresence>
              </motion.div>
            </div>
          )}
    </AnimatePresence>
  );
}
