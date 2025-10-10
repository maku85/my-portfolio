import Link from "next/link";

const Logo = () => (
  <Link
    href="/"
    className="flex flex-col md:flex-row items-center gap-2 font-extrabold text-6xl tracking-tight"
  >
    <span>Mauro</span>
    <span className="text-accent">Cunsolo</span>
  </Link>
);

export default function Navbar() {
  return (
    <nav className="w-full">
      <div className="container max-w-6xl mx-auto px-4 flex flex-col items-center justify-center pt-20">
        <Logo />
      </div>
    </nav>
  );
}
