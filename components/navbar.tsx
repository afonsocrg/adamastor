import Image from "next/image";
import Link from "next/link";
import NavbarUserMenu from "./navbar-user-menu";

const Navbar = () => {
	return (
		<>
			<div className="bg-[#04C9D8] w-full h-1" />

			<nav className="p-4 mb-2 border-b">
				<div className="max-w-screen-xl mx-auto flex justify-between items-center gap-4">
					<div className="order-2 w-auto max-w-[13rem] text-right text-sm font-normal leading-tight text-muted-foreground md:order-1 md:w-60 md:max-w-none md:text-left">
						<Link href="/">
							<p className="max-w-48">A digital publication about all things startup in Portugal</p>
						</Link>
					</div>

					<div className="order-1 flex flex-none justify-start md:order-2 md:flex-1 md:justify-center">
						<Link href="/">
							<Image
								priority
								className="w-40 dark:hidden"
								src={"/adamastorLogotype.svg"}
								height={160}
								width={160}
								alt="Adamastor Logotype"
							/>
							<Image
								priority
								className="hidden w-40 dark:block"
								src={"/adamastorLogotypeDark.svg"}
								height={160}
								width={160}
								alt="Adamastor Logotype"
							/>
						</Link>
					</div>

					<div className="order-3 hidden w-60 justify-end md:block">
						<div className="flex gap-3 justify-end !text-muted-foreground">
							<Link href="/about" className="hover:underline hover:text-primary transition-colors">
								About
							</Link>
							<Link href="/events" className="hover:underline hover:text-primary flex gap-1 group transition-colors">
								Events
							</Link>
							<NavbarUserMenu />
						</div>
					</div>
				</div>
			</nav>
		</>
	);
};

export default Navbar;
