import Image from "next/image";
import Link from "next/link";
import NavbarSections from "./navbar-sections";
import NavbarSubscribeCta from "./navbar-subscribe-cta";
import NavbarUserMenu from "./navbar-user-menu";

const Navbar = () => {
	return (
		<>
			<div className="bg-navy dark:bg-navy-lifted w-full h-[5px]" />

			<div className="pt-4 pb-3 md:pb-8">
				<div className="max-w-6xl mx-auto flex justify-between items-center gap-4 px-4 md:px-8">
					<div className="order-2 w-auto max-w-[13rem] text-right text-sm leading-tight md:order-1 md:w-60 md:max-w-none md:text-left">
						<p className="max-w-48 font-bold italic text-navy dark:text-navy-lifted [font-family:var(--font-lora-bold)] [text-wrap:balance]">
							A digital publication about all things startup in Portugal
						</p>
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

					<div className="order-3 hidden w-60 justify-end md:flex md:items-center md:gap-4">
						<NavbarSubscribeCta />
						<NavbarUserMenu />
					</div>
				</div>
			</div>

			<NavbarSections />
		</>
	);
};

export default Navbar;
