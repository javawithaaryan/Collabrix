import GlobalLayout from "../components/layouts/GlobalLayout";

export default function Account() {
  return (
    <GlobalLayout>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-white mb-8">Account Settings</h1>

        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-6">Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="text-slate-400 text-sm">Name</label>
                <input
                  type="text"
                  defaultValue="Your Name"
                  className="w-full mt-2 bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 text-sm">Email</label>
                <input
                  type="email"
                  defaultValue="you@example.com"
                  className="w-full mt-2 bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 text-sm">Bio</label>
                <textarea
                  defaultValue="Engineering leader passionate about building"
                  rows={3}
                  className="w-full mt-2 bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white"
                />
              </div>
            </div>
          </div>

          {/* Ship Index Card */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-6">Ship Index</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-slate-400 text-sm">Current Score</div>
                <div className="text-3xl font-bold text-green-400">1,240</div>
              </div>
              <div>
                <div className="text-slate-400 text-sm">Level</div>
                <div className="text-2xl font-bold text-white">Architect</div>
              </div>
            </div>
          </div>

          {/* Billing Card */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-6">Billing</h2>
            <div>
              <div className="text-slate-400 text-sm mb-2">Current Plan</div>
              <div className="text-white font-semibold">Pro - $29/month</div>
              <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition">
                Manage Subscription
              </button>
            </div>
          </div>

          {/* Save Button */}
          <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition">
            Save Changes
          </button>
        </div>
      </div>
    </GlobalLayout>
  );
}
