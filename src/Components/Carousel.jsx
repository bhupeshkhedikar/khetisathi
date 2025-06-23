import React, { useState, useEffect } from 'react';
import './Home.css';

const Carousel = ({ language, setLanguage, translations }) => {
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      title: language === 'english' ? "Book Our Skilled Farm Workers" : language === 'hindi' ? "हमारे कुशल खेत मजदूर बुक करें" : "आमच्या कुशल शेतमजुरांना बुक करा",
      subtitle: language === 'english' ? "Experienced workers to enhance your productivity." : language === 'hindi' ? "आपकी उत्पादकता बढ़ाने के लिए अनुभवी मजदूर।" : "तुमच्या उत्पादकतेसाठी अनुभवी मजूर.",
      image: "https://i.ibb.co/QjN4wPpK/e34dbc15-18c9-4481-910f-dc89d372c7f0-removebg-preview-1.png",
    },
    {
      title: language === 'english' ? "Book at Lowest Price" : language === 'hindi' ? "सबसे कम कीमत पर बुक करें" : "सर्वात कमी किमतीत बुक करा",
      subtitle: language === 'english' ? "Affordable rates for all farming needs." : language === 'hindi' ? "सभी खेती जरूरतों के लिए किफायती दरें।" : "सर्व खेती गरजांसाठी परवडणाऱ्या किमती.",
      image: "https://i.ibb.co/QjN4wPpK/e34dbc15-18c9-4481-910f-dc89d372c7f0-removebg-preview-1.png",
    },
    {
      title: language === 'english' ? "Book When You Want, When You Need" : language === 'hindi' ? "जब चाहें, जब जरूरत हो, बुक करें" : "जेव्हा हवे, जेव्हा गरज असेल तेव्हा बुक करा",
      subtitle: language === 'english' ? "Flexible scheduling for your convenience." : language === 'hindi' ? "आपकी सुविधा के लिए लचीला शेड्यूलिंग।" : "तुमच्या सोयीसाठी लवचिक वेळापत्रक.",
      image: "https://i.ibb.co/QjN4wPpK/e34dbc15-18c9-4481-910f-dc89d372c7f0-removebg-preview-1.png",
    },
    {
      title: language === 'english' ? "Advanced Booking Now Open" : language === 'hindi' ? "अग्रिम बुकिंग शुरू हो चुकी है" : "अग्रिम बुकिंग सुरू झाली आहे",
      subtitle: language === 'english' ? "Book skilled farm workers in advance for your upcoming tasks." : language === 'hindi' ? "अपने कामों के लिए अभी कुशल खेत मजदूर बुक करें।" : "तुमच्या कामांसाठी कुशल शेतमजूर आधीच बुक करा.",
      image: "https://i.ibb.co/QjN4wPpK/e34dbc15-18c9-4481-910f-dc89d372c7f0-removebg-preview-1.png"
    },
    {
      title: language === 'english' ? "Book Bundles Now & Save Up to 50%" : language === 'hindi' ? "अभी बंडल बुक करें और पाएं 50% तक की बचत" : "आता बंडल बुक करा आणि मिळवा ५०% पर्यंत बचत",
      subtitle: language === 'english' ? "Grab the best deals on farmworker bundles. Limited time offer!" : language === 'hindi' ? "खेत मजदूर बंडल पर सबसे बेहतरीन ऑफर पाएं। सीमित समय के लिए!" : "शेतमजूर बंडलवर सर्वोत्तम ऑफर मिळवा. मर्यादित वेळेसाठी!",
      image: "https://i.ibb.co/QjN4wPpK/e34dbc15-18c9-4481-910f-dc89d372c7f0-removebg-preview-1.png"
    }
  ];

  const t = translations[language];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <>
      <div className="language-select-container">
        <select
          className="language-select"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="english">English</option>
          <option value="hindi">हिन्दी</option>
          <option value="marathi">मराठी</option>
        </select>
      </div>
      <div className="carousel-container">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`carousel-slide ${activeSlide === index ? 'active' : index < activeSlide ? 'prev' : ''}`}
          >
            <div className="carousel-content">
              <img
                src={slide.image}
                alt={slide.title}
                className="carousel-image"
              />
              <h1 className="carousel-title">{slide.title}</h1>
              <p className="carousel-subtitle">{slide.subtitle}</p>
              <a href="#order" className="get-started-button">
                <i className="fas fa-rocket"></i>
                {t.getStarted}
              </a>
            </div>
          </div>
        ))}
        <div className="carousel-indicators">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`carousel-indicator ${activeSlide === index ? 'active' : ''}`}
              onClick={() => setActiveSlide(index)}
            ></button>
          ))}
        </div>
      </div>
    </>
  );
};

export default Carousel;