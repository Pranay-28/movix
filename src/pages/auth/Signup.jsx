import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";
import { VscChromeClose } from "react-icons/vsc";
import ContentWrapper from "../../components/contentWrapper/ContentWrapper";
import "./Auth.scss";

const Signup = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!supabase) {
                throw new Error("Signup is currently unavailable. Please try again later.");
            }
            const { data, error: signupError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (signupError) throw signupError;

            if (data.user) {
                // Redirect back to the page user was on, or home
                const from = location.state?.from?.pathname || "/";
                navigate(from, { replace: true, state: location.state });
                alert("Signup successful! Please check your email for confirmation.");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        if (!supabase) return;
        const from = location.state?.from?.pathname || "/";
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + from
            }
        });
    };

    const handleClose = () => {
        const from = location.state?.from?.pathname || "/";
        navigate(from, { state: location.state });
    };

    return (
        <div className="authSection" onClick={handleClose}>
            <div className="authBackdrop"></div>
            <ContentWrapper>
                <div className="authCard" onClick={(e) => e.stopPropagation()}>
                    <button className="closeBtn" onClick={handleClose}>
                        <VscChromeClose />
                    </button>
                    <div className="authHeader">
                        <span className="logo">MOVIX</span>
                        <h2>Create Account</h2>
                        <p>Join for free and sync your watch history across all your devices.</p>
                    </div>

                    {error && <div className="errorMessage">{error}</div>}

                    <form className="authForm" onSubmit={handleSignup}>
                        <div className="formGroup">
                            <label>Email Address</label>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="formGroup">
                            <label>Password</label>
                            <input
                                type="password"
                                placeholder="Create a password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button className="authBtn" type="submit" disabled={loading}>
                            {loading ? "Creating Account..." : "Sign Up For Free"}
                        </button>
                    </form>

                    <div className="divider"><span>OR</span></div>

                    <button className="googleBtn" onClick={handleGoogleLogin}>
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
                        Continue with Google
                    </button>

                    <div className="authFooter">
                        Already have an account? 
                        <span onClick={() => navigate("/login")}>Login</span>
                    </div>
                </div>
            </ContentWrapper>
        </div>
    );
};

export default Signup;
