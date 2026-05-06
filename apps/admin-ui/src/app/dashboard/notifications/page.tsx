import React from "react";
import Breadcrumbs from "apps/admin-ui/src/shared/component/breadcrumbs";

const Notifications = () => {
  return (
    <div className="w-full min-h-screen p-8">
      <h2 className="text-2xl text-white font-semibold mb-2">Notifications</h2>
      <Breadcrumbs title="Notifications" />

      <p className="text-center pt-24 text-white text-sm font-Poppins">No Notifications available Yet!!</p>
    </div>
  );
};

export default Notifications;
