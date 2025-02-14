import { Link } from "react-router-dom";
import "../styles/Header.css";

const Header = () => {
  return (
    <nav className="header">
      <ul>
        <li>
          <Link to="/">Ana Sayfa</Link>
        </li>
        <li>
          <Link to="/map">Harita</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Header;
