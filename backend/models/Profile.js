/**
 * Profile & Site Settings Model
 * ──────────────────────────────
 * Stores editable site content:
 * - Hero text, About bio, Specialization, Highlight, Profile image
 * - Education & Experience timeline
 * - Certifications & Achievements
 * - Social media links & Contact information
 * - Resume settings
 * - Interests/Hobbies & Footer marquee
 */

const mongoose = require('mongoose');

const hobbySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    image: { type: String, default: '' },
    num: { type: String, default: '01' },
  },
  { _id: true }
);

const socialLinkSchema = new mongoose.Schema(
  {
    platform: { type: String, required: true, trim: true },
    label: { type: String, default: '', trim: true },
    url: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const educationSchema = new mongoose.Schema(
  {
    degree: { type: String, required: true, trim: true },
    institution: { type: String, required: true, trim: true },
    year: { type: String, default: '', trim: true },
    grade: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const experienceSchema = new mongoose.Schema(
  {
    role: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    period: { type: String, default: '', trim: true },
    location: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    technologies: { type: [String], default: [] },
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const certificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    issuer: { type: String, required: true, trim: true },
    issueDate: { type: String, default: '', trim: true },
    credentialUrl: { type: String, default: '', trim: true },
    credentialId: { type: String, default: '', trim: true },
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const achievementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    date: { type: String, default: '', trim: true },
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const profileSchema = new mongoose.Schema(
  {
    heroTitle: {
      type: String,
      default: 'FULL STACK &\nMERN STACK\nDEVELOPER',
    },
    heroSubtitle: {
      type: String,
      default: 'Crafting digital experiences\nwith precision.',
    },
    name: {
      type: String,
      default: 'Anshul Kaundal',
    },
    profileImage: {
      type: String,
      default: 'me_pfp.jpg',
    },
    aboutBio: {
      type: String,
      default: "Hi, I'm Anshul Kaundal, a passionate MERN Stack Developer and Computer Science student who enjoys building modern, responsive, and user-friendly web applications.",
    },
    aboutSpecialization: {
      type: String,
      default: 'I specialize in MongoDB, Express.js, React.js, and Node.js, with a strong interest in creating scalable full-stack solutions. I love turning ideas into functional digital experiences while continuously learning and exploring new technologies.',
    },
    aboutHighlight: {
      type: String,
      default: 'Building. Learning. Creating. One project at a time.',
    },
    contactEmail: {
      type: String,
      default: 'kaundalanshul725@gmail.com',
    },
    contactPhone: {
      type: String,
      default: '+91 98765 43210',
    },
    contactLocation: {
      type: String,
      default: 'India',
    },
    resumeUrl: {
      type: String,
      default: 'resume.pdf',
    },
    marqueeText: {
      type: String,
      default: 'ANSHUL KAUNDAL PORTFOLIO © 2026 ◆ FULL STACK DEVELOPER ◆ AVAILABLE FOR WORK',
    },
    socialLinks: {
      type: [socialLinkSchema],
      default: [
        { platform: 'github', label: 'GitHub', url: 'https://github.com/kaundalanshul', order: 1 },
        { platform: 'linkedin', label: 'LinkedIn', url: 'https://linkedin.com/in/anshul-kaundal', order: 2 },
        { platform: 'twitter', label: 'Twitter / X', url: 'https://twitter.com', order: 3 },
        { platform: 'email', label: 'Email', url: 'mailto:kaundalanshul725@gmail.com', order: 4 },
      ],
    },
    education: {
      type: [educationSchema],
      default: [
        {
          degree: 'Bachelor of Technology in Computer Science & Engineering',
          institution: 'APG Shimla University',
          year: '2022 — 2026',
          grade: 'CGPA: 8.5/10',
          description: 'Core coursework in Data Structures, Algorithms, Object-Oriented Programming, Database Management Systems, and Full Stack Web Engineering.',
          order: 1,
        },
      ],
    },
    experience: {
      type: [experienceSchema],
      default: [
        {
          role: 'Full Stack MERN Developer',
          company: 'Freelance & Independent Projects',
          period: '2024 — Present',
          location: 'Remote',
          description: 'Architected and deployed full-featured web applications including the GroceryStore E-Commerce Platform. Designed resilient RESTful backend APIs and built interactive React user interfaces.',
          technologies: ['React', 'Node.js', 'Express.js', 'MongoDB', 'REST APIs', 'Render'],
          order: 1,
        },
      ],
    },
    certifications: {
      type: [certificationSchema],
      default: [
        {
          title: 'Full Stack Web Development with MERN',
          issuer: 'Coursera / Udemy',
          issueDate: '2025',
          credentialUrl: 'https://coursera.org',
          credentialId: 'CERT-MERN-2025',
          order: 1,
        },
        {
          title: 'Data Structures & Algorithms in JavaScript',
          issuer: 'HackerRank / freeCodeCamp',
          issueDate: '2024',
          credentialUrl: 'https://hackerrank.com',
          credentialId: 'CERT-DSA-2024',
          order: 2,
        },
      ],
    },
    achievements: {
      type: [achievementSchema],
      default: [
        {
          title: 'Engineered & Deployed GroceryStore E-Commerce System',
          description: 'Built end-to-end e-commerce platform with real-time cart, product catalog, chatbot integration, and admin portal hosted live on Render.',
          date: '2026',
          order: 1,
        },
      ],
    },
    hobbies: {
      type: [hobbySchema],
      default: [
        { title: 'MUSIC', image: 'hobby_music.jpg', num: '01' },
        { title: 'TRAVEL', image: 'hobby_travel.jpg', num: '02' },
        { title: 'READING', image: 'hobby_reading.jpg', num: '03' },
      ],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Profile', profileSchema);
