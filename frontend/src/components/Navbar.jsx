import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineViewGrid,
  HiOutlineSwitchHorizontal,
  HiOutlineTag,
  HiOutlineChartBar,
  HiOutlineLogout,
} from 'react-icons/hi';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const links = [
    { path: '/dashboard', label: 'Dashboard', icon: <HiOutlineViewGrid /> },
    { path: '/transactions', label: 'Transactions', icon: <HiOutlineSwitchHorizontal /> },
    { path: '/categories', label: 'Categories', icon: <HiOutlineTag /> },
    { path: '/analytics', label: 'Analytics', icon: <HiOutlineChartBar /> },
  ];

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-brand">
        <span className="navbar-logo">💰</span>
        <h1 className="navbar-title">ExpenseTracker</h1>
      </div>

      <div className="navbar-links">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
            id={`nav-${link.label.toLowerCase()}`}
          >
            {link.icon}
            <span>{link.label}</span>
          </Link>
        ))}
      </div>

      <div className="navbar-user">
        <div className="user-info">
          <div className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
          <span className="user-name">{user?.name}</span>
        </div>
        <button className="btn-logout" onClick={handleLogout} id="btn-logout">
          <HiOutlineLogout />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
