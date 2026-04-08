import content from "./content.json";

export type Content = typeof content;
export type Hero = Content["hero"];
export type Experience = Content["experience"];
export type Job = Experience["jobs"][number];
export type Skills = Content["skills"];
export type Skill = Skills["items"][number];
export type Contact = Content["contact"];

export default content;
