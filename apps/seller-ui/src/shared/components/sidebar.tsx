'use client'
import useSeller from '../../hooks/useSeller';
import useSidebar from '../../hooks/useSidebar';
import { usePathname } from 'next/navigation';
import React, { useEffect } from 'react'
import Box from './box';
import { Sidebar } from './sidebar.styles';
import SidebarMenu from './sidebar.menu';
import SidebarItem from './sidebar.item';
import Link from 'next/link';
import HomeLogo from '../../app/assets/icons/home';
import { BellRing, HomeIcon, ListOrdered, LogOut, Mail, PackageSearch, Settings, SquarePlus, TicketPercentIcon } from 'lucide-react';
import { CreditCard } from 'lucide-react';


const SidebarWrapper = () => {
  const { activeSidebar, setActiveSidebar } = useSidebar();
  const pathName = usePathname();
  const { seller } = useSeller();

  useEffect(() => {
    setActiveSidebar(pathName);

  }, [pathName, setActiveSidebar]);

  const getIconColor = (route: string) => activeSidebar === route ? "#0085ff" : "#969696";


  return (
    <Box
      css={{
        height: "10ovh",
        zIndex: 202,
        position: "sticky",
        padding: "8px",
        top: "0",
        overflowY: "scroll",
        scrollbarWidth: "none",
      }}

      className='sidebar-wrapper'
    >
      <Sidebar.Header>
        <Link href={"/"} className="flex justify-center text-center gap-2">
          <HomeLogo />
          <Box>
            <h3 className='text-xl font-medium text-[#ecedee]'>{seller?.shop?.name}</h3>
            <h5 className='font-medium pl-2 text-xs text-[#ecedeecf] whitespace-nowrap overflow-hidden text-ellipsis max-w-[170px]' >{seller?.shop?.address}</h5>
          </Box>
        </ Link>
      </Sidebar.Header>
      <div className="block my-з h-full">
        <Sidebar.Body className="body sidebar">
          <SidebarItem
            title="Dashboard"
            icon={<HomeIcon  size={24} color={getIconColor("/dashboard")} />}
            isActive={activeSidebar === "/dashboard"}
            href="/dashboard" />

          <div className="mt-2 block">
            <SidebarMenu title="Main Menu">
              <SidebarItem
                isActive={activeSidebar === "/dashboard/orders"}
                title="Orders"
                href="/dashboard/orders"
                icon={
                  <ListOrdered size={26} color={getIconColor("/dashboard/orders")} />
                }
              />
              <SidebarItem
                isActive={activeSidebar === "/payments"}
                title="Payments"
                href="/dashboard/payments"
                icon={
                  <CreditCard size={26} color={getIconColor("/dashboard/orders")} />
                } />
            </SidebarMenu>

            <SidebarMenu title="Products">
              <SidebarItem
                isActive={activeSidebar === "/dashboard/create-product"}
                title="Create Product"
                href="/dashboard/create-product"
                icon={<SquarePlus size={24} color={getIconColor("/dashboard/create-product")} />
                } />

              <SidebarItem
                isActive={activeSidebar === "/dashboard/all-products"}
                title="All Products"
                href="/dashboard/all-products"
                icon={<PackageSearch size={24} color={getIconColor("/dashboard/all-products")} />
                } />
            </SidebarMenu>

            <SidebarMenu title="Events">
              <SidebarItem
                isActive={activeSidebar === "/dashboard/create-event"}
                title="Create Event"
                href="/dashboard/create-event"
                icon={
                  <ListOrdered size={24} color={getIconColor("/dashboard/create-event")} />
                }
              />
              <SidebarItem
                isActive={activeSidebar === "/dashboard/all-events"}
                title="All Event"
                href="/dashboard/all-events"
                icon={
                  <ListOrdered size={24} color={getIconColor("/dashboard/all-events")} />
                }
              />
            </SidebarMenu>

            <SidebarMenu title="Controllers">
              <SidebarItem
                isActive={activeSidebar === "/dashboard/inbox"}
                title="Inbox"
                href="/dashboard/inbox"
                icon={
                  <Mail size={24} color={getIconColor("/dashboard/inbox")} />
                }
              />
              <SidebarItem
                isActive={activeSidebar === "/dashboard/settings"}
                title="Settings"
                href="/dashboard/settings"
                icon={
                  <Settings size={24} color={getIconColor("/dashboard/settings")} />
                }
              />
              <SidebarItem
                isActive={activeSidebar === "/dashboard/notifications"}
                title="Notifications"
                href="/notifications"
                icon={
                  <BellRing size={24} color={getIconColor("/dashboard/notifications")} />
                }
              />

            </SidebarMenu>

            <SidebarMenu title="Extras">
              <SidebarItem
                isActive={activeSidebar === "/dashboard/discount-codes"}
                title="Discount Codes"
                href="/dashboard/discount-codes"
                icon={
                  <TicketPercentIcon size={24} color={getIconColor("/dashboard/discount-codes")} />
                }
              />

              <SidebarItem
                isActive={activeSidebar === "/logout"}
                title="Logout"
                href="/"
                icon={
                  <LogOut size={24} color={getIconColor("/logout")} />
                }
              />
            </SidebarMenu>


          </ div>
        </Sidebar.Body>
      </ div>
    </Box >

  );
};

export default SidebarWrapper;
