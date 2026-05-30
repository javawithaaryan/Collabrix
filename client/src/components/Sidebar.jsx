import { Link, useLocation } from "react-router-dom";
import { 
  LayoutGrid, 
  BookOpen, 
  Users, 
  Settings, 
  LogOut, 
  Hexagon 
} from "lucide-react";

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { name: "Workspaces", path: "/dashboard", icon: LayoutGrid },
    { name: "Resource Hub", path: "/resources", icon: BookOpen },
    { name: "Team Directory", path: "/team", icon: Users },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <div className="w-64 bg-black border-r border-zinc-900 h-screen flex flex-col justify-between p-6">
      <div>
        {/* Brand */}
        <div className="flex flex-col gap-1 mb-10 pl-2">
          <div className="flex items-center gap-2 text-xl font-extrabold text-white">
            <Hexagon className="w-6 h-6 text-emerald-500 fill-emerald-500/20" />
            Collabrix
          </div>
          <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">
            Engineering Hub
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                  isActive 
                    ? "bg-zinc-900 text-white shadow-sm border border-zinc-800" 
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-zinc-500"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Profile & Sign Out */}
      <div className="border-t border-zinc-900 pt-6 flex flex-col gap-3">
        <div className="flex items-center gap-3 px-2 mb-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-emerald-900/20">
            AD
          </div>
          <div>
            <div className="text-sm font-bold text-zinc-200">Admin</div>
            <div className="text-[10px] text-zinc-500 font-mono">admin@collabrix.io</div>
          </div>
        </div>
        
        <button className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/10 group w-full">
          <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Sign out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;