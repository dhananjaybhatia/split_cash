import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FEATURES, STEPS, TESTIMONIALS } from "@/lib/landing";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col pt-16 ">
      <section className="mt-20 pb-12  space-y-10 md:space-y-20 px-5 ">
        <div className="container mx-auto px-4 md:px-6 text-center space-y-6 ">
          <Badge
            variant="outline"
            className="bg-[#edafcf] text-[#4A5759] px-6 py-2 text-sm rounded-full"
          >
            Split expenses. Simplify life.
          </Badge>
          <h1 className="gradient-title mx-auto max-w-4xl text-4xl md:text-7xl">
            The smartest way to split expenses with friends!
          </h1>
          <p className="max-auto md:text-cl/relaxed text-[#4A5759]">
            Track shared expenses, split bills effortlessly, and settle up
            quickly. Never worry about who owes who again.
          </p>
          <div className=" flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size={"lg"}
              className="bg-[#ff0054] text-[#F7E1D7] transition transform hover:scale-105 border-none"
            >
              <Link href="/dashboard">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size={"lg"}
              className="bg-[#ff0054]/10 border border-[#ff0054] text-[#ff0054] transition transform hover:scale-105"
            >
              <Link href="/">See How It works</Link>
            </Button>
          </div>
          <div className="overflow-hidden">
            <div className="shadow-2xl ">
              <Image
                src="https://images.unsplash.com/photo-1644952354935-0bc0d25a9996?q=80&w=3432&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="App preview"
                width={1280}
                height={720}
                className="rounded-lg w-full h-auto "
                priority
              />
            </div>
          </div>
        </div>
      </section>
      <section id="features" className="mt-10">
        <div className="container mx-auto px-4 md:px-6 text-center space-y-6">
          <Badge
            variant="outline"
            className="bg-[#edafcf] text-[#4A5759] px-6 py-2 text-sm rounded-full"
          >
            Features
          </Badge>
          <h2 className="gradient-title text-3xl md:text-4xl max-w-3xl mx-auto">
            Everything yu need to split expenses
          </h2>
          <p className="mx-auto mt-3 max-w-[700px] me:text-xl/relaxed text-[#4A5759]">
            Our platform provides all the tools you need to handle shared
            expenses with ease.
          </p>
          <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ title, Icon, bg, color, description }) => (
              <Card
                key={title}
                className="flex flex-col items-center space-x-4 p-6 text-center"
              >
                <div className={`rounded-full p-3 ${bg}`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <h3 className="font-bold">{title}</h3>
                <p className="text-[#4e5050]">{description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
      <section id="how-it-works" className="mt-15">
        <div className="container mx-auto px-4 md:px-6 text-center space-y-6">
          <Badge
            variant="outline"
            className="bg-[#edafcf] text-[#4A5759] px-6 py-2 text-sm rounded-full"
          >
            How It Works
          </Badge>
          <h2 className="gradient-title text-3xl md:text-4xl max-w-3xl mx-auto">
            Splitting expenses has never been easier.
          </h2>
          <p className="mx-auto mt-3 max-w-[700px] me:text-xl/relaxed text-[#4A5759]">
            Follow these simple steps to start tracking and splitting expenses
            with friends.
          </p>
          <div className="mx-auto mt-12 grid max-w-5xl gap-8  lg:grid-cols-3">
            {STEPS.map(({ label, title, description }) => (
              <div key={label} className="flex flex-col items-center space-y-4">
                <div className="flex h-12 w-12 justify-center items-center rounded-full bg-[#BBB5A8] text-[#4A5759]">
                  {label}
                </div>
                <h3 className="font-bold">{title}</h3>
                <p className="text-[#4e5050]">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="mt-15">
        <div className="container mx-auto px-4 md:px-6 text-center space-y-6">
          <Badge
            variant="outline"
            className="bg-[#edafcf] text-[#4A5759] px-6 py-2 text-sm rounded-full"
          >
            Testimonials
          </Badge>
          <h2 className="gradient-title text-3xl md:text-4xl max-w-3xl mx-auto">
            What our users are saying
          </h2>

          <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map(({ quote, name, image, role }) => (
              <Card key={quote}>
                <CardContent className="space-y-4 p-6">
                  <p className="text-[#4A5759]">{quote}</p>
                  <div className="flex items-center space-x-3">
                    {" "}
                    <Avatar>
                      <AvatarImage src={image} alt={name} />
                      <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="text-sm font-medium">{name}</p>
                      <p className="text-sm text-muted-foreground">{role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      <section className="gradient p-20 mt-10">
        <div className="container mx-auto px-4 md:px-6 text-center space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl text-[#F4F1EC]">
            Ready to simplify expense sharing?
          </h2>
          <p className="mx-auto max-w-[700px] text-[#EBE1D7] md:text-xl/relaxed">
            Join thousands of users who have made splitting expenses
            stress-free.
          </p>
          <Button
            asChild
            size={"lg"}
            className="bg-[#ff0054] text-[#F7E1D7] transition transform hover:scale-105 border-none"
          >
            <Link href="/dashboard">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
      <footer className=" text-[#4A5759] py-6 ">
        <div className="container mx-auto px-4 text-center text-sm">
          &copy; {new Date().getFullYear()} DBhatia.
        </div>
      </footer>
    </div>
  );
}
