import React from "react";
import Breadcrumbs from "apps/admin-ui/src/shared/component/breadcrumbs";

const Management = () => {
  return (
    <div className="w-full min-h-screen p-8">
      <h2 className="text-2xl text-white font-semibold mb-2">Management</h2>
      <Breadcrumbs title="Management" />

      <p className="text-center pt-24 text-white text-sm font-Poppins">No Management available Yet!!</p>
    </div>
  );
};

export default Management;