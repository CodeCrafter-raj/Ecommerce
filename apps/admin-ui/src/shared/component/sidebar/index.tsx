"use client";

import React, { useEffect } from "react"
import useSidebar from "../../../hooks/useSidebar"
import { usePathname } from "next/navigation"
import useAdmin from "../../../hooks/useAdmin"
import Box from "../box/index"
import { Sidebar } from "./sidebar.styles";
import Logo from "../../../assets/svgs/logo";
import Link from "next/link";
import SidebarItem from "./sidebar.item";
import { BellRing, BellPlus, FileClock, Home, ListOrdered, PackageSearch, Settings, Store, PencilRuler, LogOut } from "lucide-react";
import SidebarMenu from "./sidemenu";
import Payment from "../../../assets/svgs/payment";
const SidebarWrapper = () => {
  const { activeSidebar, setActiveSidebar } = useSidebar();
  const pathName = usePathname();
  const { admin } = useAdmin();

  useEffect(() => {
    setActiveSidebar(pathName);
  }, [pathName, setActiveSidebar]);




  const getIconColor = (route: string) => {
    activeSidebar === route ? "#0085ff" : "#969696";
  }

  return (
    <div>
      <Box
        css={{
          height: "100vh",
          zIndex: 202,
          position: "sticky",
          padding: "8px",
          top: "0",
          overflowY: "scroll",
          scrollbarWidth: "none",
        }}
        className="sidebar-wrapper"
      >
        <Sidebar.Header>
          <Box>
            <Link href={"/"} className="flex justify-center items-center gap-2">
              <Logo />
              <Box>
                <h3 className="text-xl font-medium text-[#ecedee]">{admin?.name}</h3>
                <h5 className="font-medium pl-2 text-xs text-[#ecedeecf] whitespace-nowrap">
                  {admin?.email}
                </h5>
              </Box>
            </Link>
          </Box>
        </Sidebar.Header>
        <div className="block my-3 h-full">
          <Sidebar.Body className="body sidebar">
            <SidebarItem
              title="Dashboard"
              icon={<Home color={getIconColor("/dashboard")} />}
              isActive={activeSidebar === "/dashboard"}
              href="/dashboard"
            />
            <div className="mt-2 block">
              <SidebarMenu title="Main Menu">
                <SidebarItem
                  isActive={activeSidebar === "/dashboard/orders"}
                  href="/dashboard/orders"
                  title="Orders"
                  icon={<ListOrdered size={26} color={getIconColor("/dashboard/orders")} />}
                />
                <SidebarItem
                  isActive={activeSidebar === "/dashboard/payments"}
                  href="/dashboard/payments"
                  title="Payments"
                  icon={<Payment fill={getIconColor("/dashboard/payments")} />}
                />
                <SidebarItem
                  isActive={activeSidebar === "/dashboard/products"}
                  href="/dashboard/products"
                  title="Products"
                  icon={<PackageSearch size={26} color={getIconColor("/dashboard/products")} />}
                />
                <SidebarItem
                  isActive={activeSidebar === "/dashboard/events"}
                  href="/dashboard/events"
                  title="Events"
                  icon={<BellPlus size={26} color={getIconColor("/dashboard/events")} />}
                />
                <SidebarItem
                  isActive={activeSidebar === "/dashboard/users"}
                  href="/dashboard/users"
                  title="Users"
                  icon={<User size={26} color={getIconColor("/dashboard/users")} />}
                />
                <SidebarItem
                  isActive={activeSidebar === "/dashboard/sellers"}
                  href="/dashboard/sellers"
                  title="Sellers"
                  icon={<Store size={26} color={getIconColor("/dashboard/sellers")} />}
                />
              </SidebarMenu>


              {/* Another Sidebar */}
              <SidebarMenu title="Controllers">
                <SidebarItem
                  isActive={activeSidebar === "/dashboard/loggers"}
                  href="/dashboard/loggers"
                  title="Loggers"
                  icon={<FileClock size={26} color={getIconColor("/dashboard/loggers")} />}
                />
                <SidebarItem
                  isActive={activeSidebar === "/dashboard/management"}
                  href="/dashboard/management"
                  title="Management"
                  icon={<Settings size={26} color={getIconColor("/dashboard/management")} />}
                />
                <SidebarItem
                  isActive={activeSidebar === "/dashboard/notifications"}
                  href="/dashboard/notifications"
                  title="Notifications"
                  icon={<BellRing size={26} color={getIconColor("/dashboard/notifications")} />}
                />
              </SidebarMenu>
              <SidebarMenu title="Customization">
                <SidebarItem
                  isActive={activeSidebar === "/dashboard/customization"}
                  href="/dashboard/customization"
                  title="Customization"
                  icon={<PencilRuler size={26} color={getIconColor("/dashboard/customization")} />}
                />
              </SidebarMenu>

              <SidebarMenu title="Extras">
                <SidebarItem
                  isActive={activeSidebar === "/dashboard/extras"}
                  href="/"
                  title="Logout"
                  icon={<LogOut size={26} color={getIconColor("/logout")} />}
                />
              </SidebarMenu>
            </div>
          </Sidebar.Body>
        </div>
      </Box>
    </div >
  );
};

export default SidebarWrapper;
