import react from "react";

interface Props {
  title: string;
  children: React.ReactNode;
}

const SideMenu = ({ title, children }: Props) => {
  return (
    <div className="block">
      <h3 className="text-xs tracking-[0.04rem] pl-1">{title}</h3>
      {children}
    </div>
  );
};

export default SideMenu;