import Image from "next/image";
import Link from "next/link";

export default function About() {
  return (
    <>
      <section className="m-12">
        <h1 className="md:text-4xl scroll-m-20 tracking-tight !leading-tight text-3xl font-extrabold text-[#104357] dark:text-[#E3F2F7]">
          About Us
        </h1>
        <p className="md:text-3xl font-light text-xl text-muted-foreground leading-7 [&:not(:first-child)]:mt-6">
          The Adamastor ethos personifies the Cape of Good Hope, once feared as the cape of storms. It represents the
          overcoming of fear by venturers and seafarers as they struggled to find a maritime way to India.
        </p>
        <p className="md:text-3xl font-light text-xl text-muted-foreground leading-7 [&:not(:first-child)]:mt-6">
          We tell the story of Portuguese makers and entrepreneurs who deal with fear every single day. We aim to be a
          source of information for anyone who wants to know what's happening in Portugal.
        </p>
      </section>
      <section className="m-12">
        <h1 className="md:text-4xl scroll-m-20 tracking-tight !leading-tight text-3xl font-extrabold text-[#104357] dark:text-[#E3F2F7]">
          Our team
        </h1>
        <div className="flex gap-6">
          <div>
            <Image alt="Carlos Resende" src="/carlos.jpeg" width={150} height={150} />
            <Link
              className="underline underline-offset-2"
              href={"https://www.linkedin.com/in/carlos-resende-%F0%9F%94%B7-35162613/"}
            >
              Carlos Resende
            </Link>
          </div>
          <div>
            <Image alt="Afonso Gonçalves" src="/afonso.jpeg" width={150} height={150} />
            <Link className="underline underline-offset-2" href={"https://www.linkedin.com/in/afonsocrg/"}>
              Afonso Gonçalves
            </Link>
          </div>
          <div>
            <Image alt="Malik Piara" src="/malik.jpeg" width={150} height={150} />
            <Link className="underline underline-offset-2" href={"https://www.linkedin.com/in/malikpiara/"}>
              Malik Piara
            </Link>
          </div>
          <div>
            <Image alt="Mariana Lobo" src="/mariana.jpeg" width={150} height={150} />
            <Link className="underline underline-offset-2" href={"https://www.linkedin.com/in/mariana-fino-lobo/"}>
              Mariana Lobo
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
