import {
  Droplets, Zap, Microscope, ShieldCheck, FileText, FolderCheck, Ship,
  Fuel, Package, Container, Car, Users, Landmark, FlaskConical,
  Snowflake, GitBranch, ClipboardList, CheckCircle, Anchor,
} from "lucide-react";

const map = {
  Droplets, Zap, Microscope, ShieldCheck, FileText, FolderCheck, Ship,
  Fuel, Package, Container, Car, Users, Landmark, FlaskConical,
  Snowflake, GitBranch, ClipboardList, CheckCircle, Anchor,
};

export default function Icon({ name, ...props }) {
  const Cmp = map[name] || Anchor;
  return <Cmp {...props} />;
}
