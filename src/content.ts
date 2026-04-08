import content from "./content.json";

export type Content = typeof content;
export type Meta = Content["meta"];
export type Hero = Content["hero"];
export type Experience = Content["experience"];
export type Projects = Content["projects"];
export type Project = Projects["projects"][number];
export type Job = Experience["jobs"][number];
export type Spotlight = Content["spotlight"];
export type SkillsShowcase = Content["skillsShowcase"];
export type Contact = Content["contact"];

export default content;
