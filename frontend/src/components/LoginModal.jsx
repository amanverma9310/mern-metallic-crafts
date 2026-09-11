import { useState } from "react";
import Modal from "./Modal";
import { useApp } from "../context/AppContext";

export default function LoginModal({ isOpen, onClose, onSwitchToSignup }) {
  const { login } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setEmail("");
    setPassword("");
    setError("");
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill all fields");
      return;
    }
    setError("");
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      handleClose();
    } else {
      setError(result.error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Login">
      <h2 className="modal-title">Welcome Back</h2>
      <p className="modal-subtitle">Login to your ClockStore account</p>
      <form onSubmit={handleSubmit} noValidate>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-group">
          <label htmlFor="loginEmail">Email Address</label>
          <input
            id="loginEmail"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="loginPassword">Password</label>
          <input
            id="loginPassword"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      <p className="modal-footer-note">
        Don't have an account?{" "}
        <a onClick={onSwitchToSignup}>Sign up here</a>
      </p>
     
    </Modal>
  );
}
