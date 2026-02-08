import Image from "next/image";
import Link from "next/link";

export interface AuthTemplateProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const AuthTemplate: React.FC<AuthTemplateProps> = ({
  children,
  title,
  subtitle,
}) => {
  return (
    <div className="flex min-h-screen">
      {/* Panneau gauche : image (masqué sur mobile) */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-[55%] min-h-screen overflow-hidden">
        <Image
          src="/wallpaper.jpg"
          alt="Cortexa - Votre second cerveau intelligent"
          fill
          className="object-cover"
          priority
          sizes="(max-width: 1024px) 0vw, 55vw"
        />
        <div className="absolute inset-0 flex flex-col justify-end p-12 text-white">
          <blockquote className="space-y-4">
            <p className="text-lg font-medium leading-relaxed opacity-95 md:text-xl">
              &ldquo;Centralisez vos savoirs et structurez vos idées au même endroit.&rdquo;
            </p>
          </blockquote>
        </div>
      </div>

      {/* Panneau droit : formulaire + logo */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md space-y-8">
          {/* Logo */}
          <Link href="/" className="flex justify-center">
            <Image
              src="/logo.svg"
              alt="Cortexa"
              width={120}
              height={48}
              className="h-10 w-auto object-contain sm:h-12"
              priority
            />
          </Link>

          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>

          <div className="space-y-6 text-foreground">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
