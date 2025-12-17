/* eslint-disable react/no-unescaped-entities */
'use client'
import React from 'react';

const PrivacyPolicy= () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 font-sans text-gray-800 leading-relaxed text-base">
      {/* Title */}
      <h1 className="text-5xl font-bold text-center mb-4">Privacy Policy</h1>
      <p className="text-2xl font-bold text-center mb-4">
        Foster Hartley Limited – Transport Management App
      </p>
      <p className="text-lg text-center mb-16">Last updated: December 2025</p>

      {/* 1. Introduction */}
      <h2 className="text-3xl font-bold mt-16 mb-6">1. Introduction</h2>
      <p className="mb-4">
        Foster Hartley Limited (<strong>"we"</strong>, <strong>"us"</strong>, or <strong>"our"</strong>) operates the Foster Hartley Transport Management mobile application (the <strong>"App"</strong>). This Privacy Policy explains how we collect, use, store, disclose, and protect personal data when you use the App, in accordance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
      </p>
      <p className="mb-4">
        The App is intended solely for professional drivers and fleet management personnel engaged by Foster Hartley Limited. Use of the App is part of your professional duties. Please read this Privacy Policy carefully. If you do not agree with its terms, you must not use the App.
      </p>
      <p className="mb-8">
        By accessing or using the App, you acknowledge that you have read and understood this Privacy Policy and that your personal data will be processed as described below.
      </p>

      {/* 2. Information We Collect */}
      <h2 className="text-3xl font-bold mt-16 mb-6">2. Information We Collect</h2>
      <p className="mb-8">
        We collect and process only the personal data that is necessary for the operation of the App, fleet management, employment administration, and compliance with legal and regulatory obligations.
      </p>

      <h3 className="text-2xl font-bold mt-10 mb-4">2.1 Personal and Employment Information</h3>
      <p className="mb-4">We may collect the following information directly from you or from your employment records:</p>
      <ul className="list-disc pl-10 mb-8 space-y-2">
        <li>Full name and contact details (including email address and telephone number)</li>
        <li>Home address and next-of-kin details</li>
        <li>Profile photograph</li>
        <li>Professional qualifications and credentials, including driving licence category (D or D1), Driver CPC certification details, and expiry dates</li>
        <li>Employment-related information, including contract start date, rota start date, and allocated work locations</li>
        <li>Digital signatures provided in connection with employment documents, declarations, or acknowledgements</li>
      </ul>

      <h3 className="text-2xl font-bold mt-10 mb-4">2.2 Location Data</h3>
      <p className="mb-4">The App collects precise location data where this is necessary for operational and compliance purposes, including:</p>
      <ul className="list-disc pl-10 mb-6 space-y-2">
        <li>GPS location data at clock-in and clock-out to verify attendance at allocated sites</li>
        <li>Location data captured during vehicle walkaround checks and inspections</li>
        <li>Location pinning when recording fuel log entries</li>
        <li>Movement and positional data during walkaround inspections to support compliance monitoring</li>
      </ul>
      <p className="mb-8">
        Location data is collected only during active use of relevant App functions and is not used for continuous personal tracking outside those functions.
      </p>

      <h3 className="text-2xl font-bold mt-10 mb-4">2.3 Device, Motion, and Sensor Data</h3>
      <p className="mb-4">To ensure vehicle safety compliance and integrity of inspections, the App may collect:</p>
      <ul className="list-disc pl-10 mb-6 space-y-2">
        <li>Motion and movement data (such as accelerometer and compass data) during walkaround checks</li>
        <li>Time and duration data relating to safety inspections</li>
        <li>Limited device information necessary for App functionality, security, and fraud prevention</li>
      </ul>
      <p className="mb-8 font-bold">
        Important notice: Walkaround inspection timing and movement data may be disclosed to the Driver and Vehicle Standards Agency (DVSA) upon lawful request to demonstrate compliance with vehicle safety inspection requirements.
      </p>

      <h3 className="text-2xl font-bold mt-10 mb-4">2.4 Camera, Photographs, and Video</h3>
      <p className="mb-4">The App requires access to the device camera in order to capture live media for compliance and audit purposes, including:</p>
      <ul className="list-disc pl-10 mb-6 space-y-2">
        <li>Live photographs of vehicle oil dipstick checks during walkaround inspections</li>
        <li>Live photographs or video of identified vehicle defects</li>
        <li>Live photographs of vehicles at fuel stations</li>
        <li>Live photographs of fuel receipts</li>
        <li>Random photo or video verification responses during walkaround inspection questions</li>
      </ul>
      <p className="mb-8">
        All photographs and videos must be captured live through the App. Uploading existing images or videos from device storage is not permitted. This measure is implemented to ensure authenticity, accuracy, and regulatory compliance.
      </p>

      <h3 className="text-2xl font-bold mt-10 mb-4">2.5 Work, Duty, and Operational Data</h3>
      <p className="mb-4">We collect operational data necessary for transport management, payroll, and regulatory compliance, including:</p>
      <ul className="list-disc pl-10 mb-8 space-y-2">
        <li>Clock-in and clock-out records</li>
        <li>Duty start and end times</li>
        <li>Vehicle selection and allocation records</li>
        <li>Vehicle registration numbers and mileage readings (start and end)</li>
        <li>Driving hours, other duty hours, and rest or break periods</li>
        <li>Walkaround check results and vehicle defect reports</li>
        <li>Service Unit (SU) transport data, including routes, locations, directions, and passenger counts</li>
        <li>Fuel log data, including cost, quantity (litres), and fuel card usage</li>
        <li>Working rotas and schedule information</li>
        <li>Holiday requests, sickness absence, and other leave records</li>
        <li>Driver CPC module completion records and training history</li>
      </ul>

      {/* 3. How We Use Your Information */}
      <h2 className="text-3xl font-bold mt-16 mb-6">3. How We Use Your Information</h2>
      <p className="mb-4">We use personal data for the following purposes, where necessary and proportionate:</p>
      <ul className="list-disc pl-10 mb-8 space-y-2">
        <li>To provide, operate, and maintain the core functionality of the App</li>
        <li>To verify driver identity, qualifications, and employment status</li>
        <li>To comply with DVSA requirements, transport safety standards, and operator licence obligations</li>
        <li>To manage work schedules, rotas, and duty assignments</li>
        <li>To monitor working time and generate duty records for legal compliance</li>
        <li>To allocate vehicles and manage fleet operations</li>
        <li>To record, verify, and audit vehicle safety inspections</li>
        <li>To monitor fuel usage and associated costs</li>
        <li>To manage vehicle maintenance through defect reporting</li>
        <li>To administer holiday requests, sickness absence, and other leave</li>
        <li>To maintain training records and Driver CPC compliance</li>
        <li>To facilitate operational communication between drivers and management</li>
        <li>To calculate working hours and remuneration for payroll purposes</li>
        <li>To provide access to the App's knowledge library and AI-powered search functionality</li>
      </ul>

      {/* 4. Disclosure of Personal Data */}
      <h2 className="text-3xl font-bold mt-16 mb-6">4. Disclosure of Personal Data</h2>
      <p className="mb-8">We may share personal data only where necessary and lawful, as set out below.</p>

      <h3 className="text-2xl font-bold mt-10 mb-4">4.1 Regulatory Authorities</h3>
      <p className="mb-8">
        We may disclose walkaround inspection records, including timing, movement data, images, and inspection outcomes, to the Driver and Vehicle Standards Agency (DVSA) or other competent authorities where required or permitted by law.
      </p>

      <h3 className="text-2xl font-bold mt-10 mb-4">4.2 Internal Access</h3>
      <p className="mb-8">
        Personal data is accessible only to authorised employees and contractors of Foster Hartley Limited, including administrators, managers, and mechanics, where access is necessary to perform their roles (for example, managing schedules, approving changes, processing defect reports, and overseeing fleet compliance).
      </p>

      <h3 className="text-2xl font-bold mt-10 mb-4">4.3 Legal and Statutory Disclosure</h3>
      <p className="mb-8">
        We may disclose personal data where required to do so by law, court order, or in response to valid requests from public authorities or regulators.
      </p>

      <h3 className="text-2xl font-bold mt-10 mb-4">4.4 Service Providers</h3>
      <p className="mb-8">
        We may share personal data with trusted third-party service providers who support the operation of the App, such as cloud hosting, secure data storage, and technical support services. All such providers are subject to contractual obligations to process data only on our instructions and to maintain appropriate security measures.
      </p>

      {/* 5. Data Retention */}
      <h2 className="text-3xl font-bold mt-16 mb-6">5. Data Retention</h2>
      <p className="mb-8">
        We retain personal data only for as long as necessary to fulfil the purposes described in this Privacy Policy, unless a longer retention period is required or permitted by law.
      </p>
      <p className="mb-8">
        Employment-related records, including duty logs, vehicle inspection records, and compliance documentation, are retained in accordance with UK employment law, operator licensing requirements, and transport regulations. Following termination of employment, certain records will be retained for statutory or regulatory purposes and securely deleted thereafter.
      </p>

      {/* 6. Data Security */}
      <h2 className="text-3xl font-bold mt-16 mb-6">6. Data Security</h2>
      <p className="mb-8">
        We implement appropriate technical and organisational measures to protect personal data against unauthorised access, loss, alteration, or disclosure. These measures include encrypted data transmission, secure authentication processes, and role-based access controls.
      </p>
      <p className="mb-8">
        While we take reasonable steps to safeguard personal data, no electronic transmission or storage system can be guaranteed to be completely secure.
      </p>

      {/* 7. Your Data Protection Rights */}
      <h2 className="text-3xl font-bold mt-16 mb-6">7. Your Data Protection Rights</h2>
      <p className="mb-4">Under UK GDPR, you have the following rights, subject to legal limitations:</p>
      <ul className="list-disc pl-10 mb-8 space-y-3">
        <li><strong>Right of access:</strong> to request a copy of your personal data</li>
        <li><strong>Right to rectification:</strong> to request correction of inaccurate or incomplete data (note that profile amendments within the App may require administrative approval)</li>
        <li><strong>Right to erasure:</strong> to request deletion of your personal data, where no legal retention obligation applies</li>
        <li><strong>Right to restrict processing:</strong> to request limitation of how your data is processed</li>
        <li><strong>Right to data portability:</strong> to request transfer of your data to another organisation</li>
        <li><strong>Right to object:</strong> to object to certain types of processing, where applicable</li>
      </ul>
      <p className="mb-8">Requests to exercise these rights should be submitted using the contact details set out below.</p>

      {/* 8. App Permissions */}
      <h2 className="text-3xl font-bold mt-16 mb-6">8. App Permissions</h2>
      <p className="mb-4">The App requires the following permissions in order to function correctly:</p>
      <ul className="list-disc pl-10 mb-8 space-y-2">
        <li><strong>Precise location:</strong> to verify attendance at allocated sites, support inspections, and record fuel locations</li>
        <li><strong>Camera:</strong> to capture live images and videos for inspections, defect reporting, fuel logging, and compliance checks</li>
        <li><strong>Motion sensors:</strong> to verify movement during walkaround inspections</li>
        <li><strong>Storage:</strong> to temporarily store captured media prior to secure upload</li>
        <li><strong>Internet access:</strong> to synchronise data with company systems and receive updates</li>
        <li><strong>Notifications:</strong> to provide alerts regarding outstanding tasks, messages, and system updates</li>
      </ul>
      <p className="mb-8">Permissions are used only for their stated purposes.</p>

      {/* 9. Children's Privacy */}
      <h2 className="text-3xl font-bold mt-16 mb-6">9. Children's Privacy</h2>
      <p className="mb-8">
        The App is intended solely for use by individuals aged 18 or over. We do not knowingly collect personal data relating to children. If you believe that a minor has provided personal data through the App, please contact us immediately.
      </p>

      {/* 10. Changes to This Privacy Policy */}
      <h2 className="text-3xl font-bold mt-16 mb-6">10. Changes to This Privacy Policy</h2>
      <p className="mb-8">
        We may update this Privacy Policy from time to time. Any changes will be published within the App and the "Last updated" date will be revised accordingly. Continued use of the App after an update constitutes acceptance of the revised Privacy Policy.
      </p>

      {/* 11. Contact Details */}
      <h2 className="text-3xl font-bold mt-16 mb-6">11. Contact Details</h2>
      <p className="mb-4">If you have any questions about this Privacy Policy or wish to exercise your data protection rights, please contact us:</p>
      <p className="mb-3 font-bold">Foster Hartley Limited</p>
      <p className="mb-3">Email: hello@fosterhartley.co.uk</p>
      <p className="mb-3">Telephone: 0333 188 7066</p>
      <p className="mb-8">
        Address: Foster Hartley Limited, c/o Hamilton Black Accountant, Trust House, 5 New Augustus Street, Bradford, England, BD1 5LL
      </p>

      {/* 12. Legal Basis for Processing */}
      <h2 className="text-3xl font-bold mt-16 mb-6">12. Legal Basis for Processing</h2>
      <p className="mb-4">We process personal data on the following lawful bases under UK GDPR:</p>
      <ul className="list-disc pl-10 mb-6 space-y-3">
        <li><strong>Contract (Article 6(1)(b)):</strong> where processing is necessary for the performance of your employment contract or to take steps at your request prior to entering into such a contract.</li>
        <li><strong>Legal obligation (Article 6(1)(c)):</strong> where processing is required to comply with DVSA requirements, operator licensing conditions, road traffic legislation, and UK employment law.</li>
        <li><strong>Legitimate interests (Article 6(1)(f)):</strong> where processing is necessary for the legitimate interests of Foster Hartley Limited in managing fleet operations, ensuring driver and public safety, preventing fraud or misuse of systems, and demonstrating ongoing regulatory compliance, provided that such interests are not overridden by your rights and freedoms.</li>
      </ul>
      <p className="mb-8">
        Where special category data is processed (for example, limited health-related absence information), such processing is carried out only where necessary and permitted under Schedule 1 of the Data Protection Act 2018.
      </p>

      {/* 13. Regulatory and Traffic Commissioner Compliance Statement */}
      <h2 className="text-3xl font-bold mt-16 mb-6">13. Regulatory and Traffic Commissioner Compliance Statement</h2>
      <p className="mb-8">
        This App forms part of Foster Hartley Limited's operator licence compliance systems. Data collected through the App is used to demonstrate effective management control, continuous compliance, and adherence to undertakings given to the Traffic Commissioner.
      </p>
      <p className="mb-4">In particular:</p>
      <ul className="list-disc pl-10 mb-8 space-y-2">
        <li>Walkaround check data, inspection duration, movement verification, images, and defect reports are used to evidence that daily safety inspections are carried out properly, thoroughly, and in accordance with DVSA guidance.</li>
        <li>Duty, driving time, and break records are used to demonstrate compliance with drivers' hours, working time, and rest requirements.</li>
        <li>Vehicle allocation, mileage, and defect data are used to support preventative maintenance systems and timely rectification of defects.</li>
      </ul>
      <p className="mb-8">
        Records generated by the App may be produced to the Traffic Commissioner, DVSA, or other competent authorities as part of audits, investigations, public inquiries, or compliance reviews.
      </p>

      {/* 14. Employee Privacy Notice (Summary) */}
      <h2 className="text-3xl font-bold mt-16 mb-6">14. Employee Privacy Notice (Summary)</h2>
      <p className="mb-8">This summary is provided for convenience and does not replace the full Privacy Policy above.</p>

      <p className="mb-3 font-bold">Who we are</p>
      <p className="mb-6">Foster Hartley Limited is the data controller responsible for your personal data.</p>

      <p className="mb-3 font-bold">Why we collect your data</p>
      <p className="mb-6">We collect and use your data to manage transport operations, comply with DVSA and operator licence requirements, ensure vehicle and public safety, administer your employment, and pay you correctly.</p>

      <p className="mb-3 font-bold">What data we collect</p>
      <p className="mb-6">This includes identity and contact details, driving qualifications, work schedules, duty and driving hours, vehicle inspection records, location data during work activities, photographs and videos taken during inspections, and payroll-related information.</p>

      <p className="mb-3 font-bold">How your data is used</p>
      <p className="mb-6">Your data is used to allocate work, record duties, evidence safety checks, manage vehicles, monitor compliance, process pay and leave, and respond to regulatory requests.</p>

      <p className="mb-3 font-bold">Who your data is shared with</p>
      <p className="mb-6">Your data may be shared internally with authorised staff and externally with regulators such as DVSA where required by law. We also use approved service providers who support our systems under strict confidentiality obligations.</p>

      <p className="mb-3 font-bold">How long we keep your data</p>
      <p className="mb-6">We keep your data only for as long as required by law or regulatory guidance. Some records must be retained after employment ends.</p>

      <p className="mb-3 font-bold">Your rights</p>
      <p className="mb-6">You have rights to access your data, request corrections, object to certain processing, and request deletion where legally permitted.</p>

      <p className="mb-3 font-bold">Contact</p>
      <p className="mb-12">For questions or to exercise your rights, contact: hello@fosterhartley.co.uk</p>

      {/* Final Statement */}
      <div className="mt-20 text-center">
        <p className="text-xl font-bold italic">
          By using the Foster Hartley Limited Transport Management App, you acknowledge that you have read, understood, and accepted this Privacy Policy and Employee Privacy Notice.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;