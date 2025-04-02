import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import pixQrCode from '../assets/img/pix_qr_code.svg';

interface DonationButtonProps {
  isCompact?: boolean;
}

function DonationButton({ isCompact = false }: DonationButtonProps): React.ReactElement {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const toggleDonationOptions = () => {
    setIsOpen(!isOpen);
  };

  const paypalLink = 'https://www.paypal.com/donate/?business=5PYUYZJLASX66&no_recurring=0&item_name=Sua+doa%C3%A7%C3%A3o+ajuda+a+manter+meu+caf%C3%A9+quente+e+este+projeto+vivo.&currency_code=BRL';
  const kofiLink = 'https://ko-fi.com/allud1t';
  const pixKey = '00020101021126360014br.gov.bcb.pix0114492686650001705204000053039865802BR5917DEVNTECH S T LTDA6010COSMOPOLIS62070503***63049C5A';

  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  const copyPixKey = () => {
    navigator.clipboard.writeText(pixKey);
    setShowCopyNotification(true);
    setTimeout(() => {
      setShowCopyNotification(false);
    }, 5000);
    setShowQRCode(true);
  };

  const toggleQRCode = () => {
    setShowQRCode(!showQRCode);
  };

  const modalRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        modalRef.current && 
        !modalRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="donation-container relative">
      {isCompact ? (
        <button
          ref={buttonRef}
          onClick={toggleDonationOptions}
          className="btn btn-sm btn-ghost text-delayo-orange hover:bg-base-200 flex items-center gap-1"
          title={t('donation.supportProject')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="h-3.5 w-3.5">
            <path d="M88 0C74.7 0 64 10.7 64 24c0 38.9 23.4 59.4 39.1 73.1l1.1 1C120.5 112.3 128 119.9 128 136c0 13.3 10.7 24 24 24s24-10.7 24-24c0-38.9-23.4-59.4-39.1-73.1l-1.1-1C119.5 47.7 112 40.1 112 24c0-13.3-10.7-24-24-24zM32 192c-17.7 0-32 14.3-32 32L0 416c0 53 43 96 96 96l192 0c53 0 96-43 96-96l16 0c61.9 0 112-50.1 112-112s-50.1-112-112-112l-48 0L32 192zm352 64l16 0c26.5 0 48 21.5 48 48s-21.5 48-48 48l-16 0 0-96zM224 24c0-13.3-10.7-24-24-24s-24 10.7-24 24c0 38.9 23.4 59.4 39.1 73.1l1.1 1C232.5 112.3 240 119.9 240 136c0 13.3 10.7 24 24 24s24-10.7 24-24c0-38.9-23.4-59.4-39.1-73.1l-1.1-1C231.5 47.7 224 40.1 224 24z" fill="currentColor" />
          </svg>
          <span>{t('donation.support')}</span>
        </button>
      ) : (
        <button
          ref={buttonRef}
          onClick={toggleDonationOptions}
          className="btn btn-ghost text-delayo-orange hover:bg-base-200 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="h-4 w-4">
            <path d="M88 0C74.7 0 64 10.7 64 24c0 38.9 23.4 59.4 39.1 73.1l1.1 1C120.5 112.3 128 119.9 128 136c0 13.3 10.7 24 24 24s24-10.7 24-24c0-38.9-23.4-59.4-39.1-73.1l-1.1-1C119.5 47.7 112 40.1 112 24c0-13.3-10.7-24-24-24zM32 192c-17.7 0-32 14.3-32 32L0 416c0 53 43 96 96 96l192 0c53 0 96-43 96-96l16 0c61.9 0 112-50.1 112-112s-50.1-112-112-112l-48 0L32 192zm352 64l16 0c26.5 0 48 21.5 48 48s-21.5 48-48 48l-16 0 0-96zM224 24c0-13.3-10.7-24-24-24s-24 10.7-24 24c0 38.9 23.4 59.4 39.1 73.1l1.1 1C232.5 112.3 240 119.9 240 136c0 13.3 10.7 24 24 24s24-10.7 24-24c0-38.9-23.4-59.4-39.1-73.1l-1.1-1C231.5 47.7 224 40.1 224 24z" fill="currentColor" />
          </svg>
          <span>{t('donation.supportProject')}</span>
        </button>
      )}

      {showCopyNotification && (
        <div className="fixed top-4 left-0 right-0 flex justify-center z-[60] pointer-events-none">
          <div className="bg-success text-white py-2 px-4 rounded-md text-center animate-fade-in-down shadow-lg pointer-events-auto">
            {t('donation.copiedSuccess')}
          </div>
        </div>
      )}
      
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div 
            ref={modalRef}
            className="donation-options card p-4 bg-base-200 shadow-lg rounded-lg w-72 max-w-[90%]"
          >
            <div className="card-title text-delayo-orange mb-2">
              {t('donation.title')}
            </div>
            <p className="text-sm mb-4">{t('donation.description')}</p>
            
            <div className="flex flex-col gap-3">
              <a 
                href={paypalLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-sm bg-[#0070ba] hover:bg-[#005ea6] text-white border-none"
              >
                <span className="font-bold">PayPal</span>
              </a>
              
              <a 
                href={kofiLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-sm bg-[#29abe0] hover:bg-[#1a8dbe] text-white border-none"
              >
                <span className="font-bold">Ko-fi</span>
              </a>
              
              <div className="pix-container relative">
                <button 
                  onClick={copyPixKey}
                  className="btn btn-sm bg-base-100 hover:bg-base-300 w-full flex justify-between items-center"
                >
                  <span className="font-bold">PIX</span>
                  <span className="text-xs">{t('donation.copyKey')}</span>
                </button>

                {showQRCode && (
                  <div className="mt-3 p-2 bg-white rounded-lg flex flex-col items-center">
                    <img 
                      src={pixQrCode} 
                      alt="QR Code PIX" 
                      className="w-full max-w-[150px] h-auto"
                    />
                    <button 
                      onClick={toggleQRCode}
                      className="btn btn-xs bg-base-100 hover:bg-base-200 text-base-content mt-2 border border-base-300"
                    >
                      {t('donation.hideQRCode')}
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <button 
              onClick={toggleDonationOptions}
              className="btn btn-ghost btn-sm mt-3 w-full"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DonationButton;