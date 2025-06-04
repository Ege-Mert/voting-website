import { Star } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-gray-200 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center md:flex-row md:justify-between">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Star className="h-5 w-5 text-gold" />
            <span className="font-semibold text-gray-800">Star Vote</span>
          </div>
          <div className="text-sm text-gray-500">
            © {currentYear} Star Vote. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;