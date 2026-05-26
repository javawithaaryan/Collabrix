import { Link, useNavigate } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  return (
    <div className="w-72 bg-zinc-950 border-r border-zinc-800 min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-10">
        Collabrix
      </h1>

      <div className="flex flex-col gap-3">
        <Link
          to="/dashboard"
          className="bg-zinc-900 hover:bg-zinc-800 transition px-4 py-3 rounded-xl"
        >
          Dashboard
        </Link>

        <button
          onClick={logout}
          className="bg-red-600 hover:bg-red-500 transition px-4 py-3 rounded-xl text-left"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;