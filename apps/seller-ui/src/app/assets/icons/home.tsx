import { Home } from 'lucide-react';

const HomeLogo = () => {
  return (
      <div>
          <Home /> {/* Basic home icon */}
          <Home size={48} color="blue" strokeWidth={3} /> {/* Customized home icon */}
      </div>
      );
    };

export default HomeLogo;
