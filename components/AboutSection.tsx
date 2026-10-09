import Image from "next/image";

const skills = [
  { skill: "HTML", colorClass: "text-blue-500" },
  { skill: "CSS", colorClass: "text-blue-500" },
  { skill: "SCSS", colorClass: "text-blue-500" },
  { skill: "LESS", colorClass: "text-blue-500" },
  { skill: "Tailwind CSS", colorClass: "text-blue-500" },
  { skill: "Styled Components", colorClass: "text-blue-500" },
  { skill: "JavaScript", colorClass: "text-yellow-500" },
  { skill: "TypeScript", colorClass: "text-yellow-500" },
  { skill: "Node.js", colorClass: "text-orange-500" },
  { skill: "React", colorClass: "text-orange-500" },
  { skill: "React Native", colorClass: "text-orange-500" },
  { skill: "Next.js", colorClass: "text-orange-500" },
  { skill: "Git", colorClass: "text-purple-500" },
  { skill: "GitHub", colorClass: "text-purple-500" },
  { skill: "Storybook", colorClass: "text-purple-500" },
  { skill: "CI/CD", colorClass: "text-purple-500" },
  { skill: "AWS", colorClass: "text-purple-500" },
  { skill: "Unit Tests", colorClass: "text-pink-500" },
  { skill: "Jest", colorClass: "text-pink-500" },
  { skill: "Enzyme", colorClass: "text-pink-500" },
  { skill: "Mocha", colorClass: "text-pink-500" },
]

const AboutSection = () => {
  return (
    <section id="about">
      <div className="my-12 pb-12 md:pt-16 md:pb-48">
        <h1 className="text-center font-bold text-4xl">
          About Me
          <hr className="w-6 h-1 mx-auto my-4 bg-teal-500 border-0 rounded"></hr>
        </h1>

        <div className="flex flex-col space-y-10 items-stretch justify-center align-top md:space-x-10 md:space-y-0 md:p-4 md:flex-row md:text-left">
          <div className="md:w-1/2 ">
            <h1 className="text-center text-2xl font-bold mb-6 md:text-left">
              Get to know me!
            </h1>
            <p>
              Hi, my name is Henrique Rocha Serrano and I am a{" "}
              <span className="font-bold">{"highly ambitious"}</span>,
              <span className="font-bold">{" self-motivated"}</span>, and
              <span className="font-bold">{" driven"}</span> software engineer
              based in Rio de Janeiro, Brazil.
            </p>
            <br />
            <p>
              I started working in the IT area in 2017, shortly after falling in
              love with programming in 2016 while studying economics at the
              Federal University of Espírito Santo (UFES).
            </p>
            <br />
            <p>
              I have a wide range of hobbies and passions that keep me busy.
              From reading, playing sports, traveling,
              I am always seeking new experiences and love to keep myself
              engaged and learning new things.
            </p>
            <br />
            <p>
              I believe that you should{" "}
              <span className="font-bold text-teal-500">
                never stop growing
              </span>{" "}
              and that&#39;s what I strive to do, I have a passion for
              technology and a desire to always push the limits of what is
              possible. I am excited to see where my career takes me and am
              always open to new opportunities. 🙂
            </p>
          </div>
          <div className="text-center md:w-1/2 md:text-left">
            <h1 className="text-2xl font-bold mb-6">My Skills</h1>
            <div className="flex flex-wrap flex-row justify-center z-10 md:justify-start">
              {skills.map((item, idx) => {
                return (
                  <p
                    key={idx}
                    className={`bg-gray-400 px-4 py-2 mr-2 mt-2 ${item.colorClass} rounded font-semibold`}
                  >
                    {item.skill}
                  </p>
                );
              })}
            </div>
            <Image
              src="/developer-hero.png"
              alt=""
              width={325}
              height={325}
              className="hidden md:block md:relative md:bottom-4 md:left-32 md:z-0"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
