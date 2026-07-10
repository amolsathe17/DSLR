const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Category = require('../models/Category');
const Event = require('../models/Event');

const seedData = async () => {
  try {
    // 1. Seed Users (Admin & Judge)
    const adminCount = await User.countDocuments({ role: 'Admin' });
    if (adminCount === 0) {
      const salt = await bcrypt.genSalt(10);
      const adminPassword = await bcrypt.hash('adminpassword', salt);
      const judgePassword = await bcrypt.hash('judgepassword', salt);

      await User.create({
        name: 'Event Administrator',
        email: 'admin@contest.com',
        password: adminPassword,
        mobile: '9876543210',
        city: 'Mumbai',
        role: 'Admin',
        isVerified: true
      });

      await User.create({
        name: 'Chief Judge Arthur',
        email: 'judge@contest.com',
        password: judgePassword,
        mobile: '8765432109',
        city: 'Delhi',
        role: 'Judge',
        isVerified: true
      });

      console.log('Seeded Users: admin@contest.com / judge@contest.com (passwords: adminpassword / judgepassword)');
    }

    // 2. Seed Categories
    const categoryCount = await Category.countDocuments({});
    if (categoryCount === 0) {
      const categories = [
        { name: 'Wildlife', description: 'Animals in their natural environments, capturing candid moments.' },
        { name: 'Nature', description: 'Scenic vistas, flora, and biological environments.' },
        { name: 'Portrait', description: 'Expressive close-ups and artistic human portraits.' },
        { name: 'Street', description: 'Candid moments of human life and urban culture.' },
        { name: 'Landscape', description: 'Majestic open spaces, mountains, deserts, and seascapes.' },
        { name: 'Macro', description: 'Extreme close-up photography of tiny details.' },
        { name: 'Architecture', description: 'Buildings, bridges, interiors, and architectural structures.' },
        { name: 'Black & White', description: 'Monochrome frames capturing tones, lighting, and textures.' }
      ];

      await Category.create(categories);
      console.log('Seeded default competition categories.');
    }

    // 3. Seed Contest Event
    const eventCount = await Event.countDocuments({});
    if (eventCount === 0) {
      const deadlineDate = new Date('2026-07-15T23:59:59.000Z');
      const eventDate = new Date('2026-07-31T23:59:59.000Z');

      await Event.create({
        title: 'National DSLR Wildlife & Landscape Championship 2026',
        theme: "Nature's Untamed Beauty",
        description: 'The premier national photography competition designed exclusively for DSLR & Mirrorless camera enthusiasts. Show us your vision of nature, wildlife, and natural landscapes.',
        venue: 'Bal-Gandharv Art Gallery, Jangali Mharaj Road Pune 411030',
        rules: [
          'All submissions must be captured using a DSLR or Mirrorless Camera. Mobile photography is strictly prohibited and results in immediate disqualification.',
          'Participants must upload high-resolution images in JPEG, PNG, or TIFF format. RAW files (.cr2, .nef, etc.) are highly recommended for metadata verification.',
          'Submissions must not contain watermarks, signatures, or borders added by post-processing.',
          'Basic editing (brightness, contrast, crop) is allowed. Heavily manipulated composites, AI additions, or removals are strictly forbidden.',
          'Entries must be uploaded before the submission deadline. Late entries will not be accepted under any circumstances.'
        ],
        deadline: deadlineDate,
        eventDate: eventDate,
        prizes: [
          { rank: '1st Prize', reward: '₹50,000 Cash + Gold Trophy', description: 'Winner of the National Championship Title' },
          { rank: '2nd Prize', reward: '₹30,000 Cash + Silver Trophy', description: 'Runner-up of the Championship' },
          { rank: '3rd Prize', reward: '₹20,000 Cash + Bronze Trophy', description: 'Second Runner-up of the Championship' }
        ],
        faqs: [
          { question: 'Is mobile photography allowed?', answer: 'No. Mobile photography is strictly prohibited. Only images captured using a DSLR or Mirrorless camera will be accepted.' },
          { question: 'What is the package fee?', answer: 'We offer 3 packages: Package 1 (1 Photo, ₹200), Package 2 (up to 2 Photos, ₹300), and Package 3 (up to 5 Photos, ₹400).' },
          { question: 'Is the RAW file required?', answer: 'Uploading a RAW file is optional, but it is highly recommended to prove DSLR eligibility in case of disputes.' },
          { question: 'How will I receive my certificate?', answer: 'All valid participants can download a digital participation certificate directly from their dashboard after results are declared.' }
        ],
        terms: [
          'Participants retain copyright of their images, but grant the organizer rights to showcase submissions on websites and promotional materials.',
          'Fees are non-refundable once payment is completed.',
          'The decision of the judging panel will be final and binding.'
        ],
        packages: [
          { id: 'pkg-1', name: 'Starter (1 Photograph)', price: 200, maxPhotos: 1 },
          { id: 'pkg-2', name: 'Amateur (Up to 2 Photographs)', price: 300, maxPhotos: 2 },
          { id: 'pkg-3', name: 'Pro (Up to 5 Photographs)', price: 400, maxPhotos: 5 }
        ],
        status: 'Active'
      });

      console.log('Seeded default active photography event.');
    }
  } catch (error) {
    console.error('Seeding error: ', error);
  }
};

module.exports = seedData;
