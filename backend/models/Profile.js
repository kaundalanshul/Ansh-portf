/**
 * Profile & Site Settings Model
 * ──────────────────────────────
 * Stores editable site content (Hero text, About bio, Profile image,
 * Interests/Hobbies, Contact info, and Footer text).
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
    marqueeText: {
      type: String,
      default: 'ANSHUL KAUNDAL PORTFOLIO © 2026 ◆ FULL STACK DEVELOPER ◆ AVAILABLE FOR WORK',
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
