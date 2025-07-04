import React, { useState } from 'react';
import translationsTermsAndConditions from './translationsTermsAndConditions.js';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

const TermsAndConditions = () => {
  const [language, setLanguage] = useState('mr'); // Default to Marathi
  const t = translationsTermsAndConditions[language];

  return (
          <><header className="bg-green-600 text-white text-center py-16">
          <h1 className="text-4xl md:text-5xl font-bold">  {t.title} </h1>
          {/* <p className="mt-4 text-lg">Guidelines for Using KhetiSathi</p> */}
      </header><div className="min-h-screen bg-gradient-to-br from-green-100 to-amber-100 p-4 md:p-8">
              <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8">
                  {/* Language Selector */}

                  <div className="mb-6 flex justify-end">
                      <select
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                          className="p-2 border rounded-lg focus:ring-2 focus:ring-green-600 bg-white"
                          aria-label={t.selectLanguage}
                      >
                          <option value="en">{t.english}</option>
                          <option value="hi">{t.hindi}</option>
                          <option value="mr">{t.marathi}</option>
                      </select>
                  </div>

                  <h1 className="text-3xl md:text-4xl font-bold text-green-700 mb-6 flex items-center">
                      <DocumentTextIcon className="w-8 h-8 mr-2" />
                      {t.title}
                  </h1>

                  <section className="mb-6">
                      <h2 className="text-2xl font-semibold text-green-600 mb-4">{t.introduction.title}</h2>
                      <p className="text-gray-700 leading-relaxed">{t.introduction.content}</p>
                  </section>

                  <section className="mb-6">
                      <h2 className="text-2xl font-semibold text-green-600 mb-4">{t.acceptance.title}</h2>
                      <p className="text-gray-700 leading-relaxed">{t.acceptance.content}</p>
                  </section>

                  <section className="mb-6">
                      <h2 className="text-2xl font-semibold text-green-600 mb-4">{t.userResponsibilities.title}</h2>
                      <ul className="list-disc list-inside text-gray-700 space-y-2">
                          <li>{t.userResponsibilities.accurateInfo}</li>
                          <li>{t.userResponsibilities.compliance}</li>
                          <li>{t.userResponsibilities.conduct}</li>
                      </ul>
                  </section>

                  <section className="mb-6">
                      <h2 className="text-2xl font-semibold text-green-600 mb-4">{t.services.title}</h2>
                      <p className="text-gray-700 leading-relaxed">{t.services.content}</p>
                  </section>

                  <section className="mb-6">
                      <h2 className="text-2xl font-semibold text-green-600 mb-4">{t.paymentTerms.title}</h2>
                      <p className="text-gray-700 leading-relaxed">{t.paymentTerms.content}</p>
                      <ul className="list-disc list-inside text-gray-700 space-y-2 mt-2">
                          <li>{t.paymentTerms.farmers}</li>
                          <li>{t.paymentTerms.drivers}</li>
                      </ul>
                  </section>

                  <section className="mb-6">
                      <h2 className="text-2xl font-semibold text-green-600 mb-4">{t.cancellationPolicy.title}</h2>
                      <p className="text-gray-700 leading-relaxed">{t.cancellationPolicy.content}</p>
                  </section>

                  <section className="mb-6">
                      <h2 className="text-2xl font-semibold text-green-600 mb-4">{t.liability.title}</h2>
                      <p className="text-gray-700 leading-relaxed">{t.liability.content}</p>
                  </section>

                  <section className="mb-6">
                      <h2 className="text-2xl font-semibold text-green-600 mb-4">{t.termination.title}</h2>
                      <p className="text-gray-700 leading-relaxed">{t.termination.content}</p>
                  </section>

                  <section className="mb-6">
                      <h2 className="text-2xl font-semibold text-green-600 mb-4">{t.changes.title}</h2>
                      <p className="text-gray-700 leading-relaxed">{t.changes.content}</p>
                  </section>

                  <section className="mb-6">
                      <h2 className="text-2xl font-semibold text-green-600 mb-4">{t.contact.title}</h2>
                      <p className="text-gray-700 leading-relaxed">{t.contact.content}</p>
                  </section>

                  <footer className="mt-8 text-gray-600 text-sm">
                      <p>{t.lastUpdated.replace('{date}', new Date().toLocaleDateString(language === 'en' ? 'en-GB' : language === 'hi' ? 'hi-IN' : 'mr-IN'))}</p>
                  </footer>
              </div>
          </div></>
  );
};

export default TermsAndConditions;