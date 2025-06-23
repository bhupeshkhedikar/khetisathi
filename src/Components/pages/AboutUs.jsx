import React from 'react';
import { Link } from 'react-router-dom';

const AboutUs = () => {
  return (
    <div className="font-poppins bg-gray-50 min-h-screen">
      {/* Hero Banner */}
      <header className="bg-green-600 text-white text-center py-16">
        <h1 className="text-4xl md:text-5xl font-bold">About KhetiSathi</h1>
        <p className="mt-4 text-lg">Empowering Farmers, Transforming Agriculture</p>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Our Story */}
        <section className="mb-12 flex flex-col md:flex-row items-center gap-8">
          <div className="md:w-1/2">
            <h2 className="text-3xl font-semibold text-green-700 mb-4">Our Story</h2>
            <p className="text-gray-600 leading-relaxed">
              Founded in 2025, KhetiSathi is dedicated to transforming agriculture in India by providing on demand services to
              farmers.and knowledge to enhance their livelihoods. Our passion
              for sustainable farming drives us to support rural communities across the nation.
            </p>
          </div>
          <img
            src="https://img.freepik.com/premium-photo/indian-farmer-field_75648-189.jpg"
            alt="Farmers in field"
            className="md:w-1/2 rounded-lg shadow-lg"
          />
        </section>

        {/* Mission & Vision */}
        <section className="mb-12 bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-3xl font-semibold text-green-700 mb-4 text-center">Our Mission & Vision</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="text-center">
              <p className="font-bold text-xl text-gray-800">Mission</p>
              <p className="text-gray-600">Make farming sustainable, profitable, and technology-driven.</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-xl text-gray-800">Vision</p>
              <p className="text-gray-600">Empower every farmer with accessible solutions.</p>
            </div>
          </div>
        </section>

        {/* Our Team */}
        <section className="mb-12 flex flex-col md:flex-row-reverse items-center gap-8">
          <div className="md:w-1/2">
            <h2 className="text-3xl font-semibold text-green-700 mb-4">Our Team</h2>
            <p className="text-gray-600 leading-relaxed">
              Our team includes agricultural experts, tech innovators, and customer support professionals
              committed to serving farmers across India. Together, we work to bring cutting-edge solutions
              to the fields.
            </p>
          </div>
          <img
            src="https://humanyze.com/wp-content/uploads/2021/06/cross-team-collaboration-min.jpg"
            alt="Team collaboration"
            className="md:w-1/2 rounded-lg shadow-lg"
          />
        </section>

        {/* Contact Information */}
        <section className="mb-12 bg-green-50 p-8 rounded-lg shadow-md">
          <h2 className="text-3xl font-semibold text-green-700 mb-4 text-center">Contact Information</h2>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <i className="fas fa-map-marker-alt text-green-600 text-2xl mb-2"></i>
              <p className="text-gray-600">AT POST LAKHORI TAH LAKHANI DIST BHANDARA, Bhandara, Maharashtra, India - 441804</p>
            </div>
            <div>
              <i className="fas fa-envelope text-green-600 text-2xl mb-2"></i>
              <p className="text-gray-600">
                <a href="mailto:support@khetisathi.com" className="hover:text-green-700">support@khetisathi.com</a>
              </p>
            </div>
            <div>
              <i className="fas fa-phone-alt text-green-600 text-2xl mb-2"></i>
              <p className="text-gray-600">+91 98765 43210</p>
            </div>
          </div>
        </section>
      </main>

    </div>
  );
};

export default AboutUs;