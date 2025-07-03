// components/Footer.tsx
import React from 'react';

const Footer: React.FC = () => {
    return (
        <div className='bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md space-y-6 border border-gray-700'>
            <footer>
                &copy; {new Date().getFullYear()} Your Company. All rights reserved.
            </footer>
        </div>
    );
};

export default Footer;
