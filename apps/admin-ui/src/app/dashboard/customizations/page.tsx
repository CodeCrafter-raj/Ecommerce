import React from "react";
import Breadcrumbs from "apps/admin-ui/src/shared/component/breadcrumbs";

const Customizations = () => {
  return (
    <div className="w-full min-h-screen p-8">
      <h2 className="text-2xl text-white font-semibold mb-2">Customizations</h2>
      <Breadcrumbs title="Customizations" />

      <p className="text-center pt-24 text-white text-sm font-Poppins">No Customizations available Yet!!</p>
    </div>
  );
};

export default Customizations;
