import { useState, useEffect } from 'react';
import type { RegisterFormProps } from './RegisterForm.types';
import type { Role, VendorProfile } from '../../config/appConfig';
import {
  UserOutlined,
  ShopOutlined,
  FileTextOutlined,
  WarningOutlined,
  CloseOutlined,
  SafetyCertificateOutlined,
  AuditOutlined,
  PaperClipOutlined,
} from '@ant-design/icons';

export const RegisterForm = ({
  onSubmit,
  isLoading,
  error,
  initialRole,
  onLoginClick,
}: RegisterFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<Role>(initialRole || 'customer');
  const [showPassword, setShowPassword] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [agreementError, setAgreementError] = useState<string | null>(null);
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);

  useEffect(() => {
    if (initialRole) {
      setRole(initialRole);
    }
  }, [initialRole]);

  // Seller Vendor Profile state
  const [vendorName, setVendorName] = useState('');
  const [businessLocation, setBusinessLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [taxId, setTaxId] = useState('');
  const [businessCategory, setBusinessCategory] = useState('Handicrafts & Woolens');
  const [description, setDescription] = useState('');
  const [documentFileName, setDocumentFileName] = useState('');

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocumentFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreementAccepted) {
      setAgreementError('Please read and accept the agreement terms to proceed with registration.');
      return;
    }
    setAgreementError(null);

    let vendorProfile: VendorProfile | undefined = undefined;
    if (role === 'seller') {
      vendorProfile = {
        vendorName: vendorName || `${firstName}'s Store`,
        businessLocation,
        phone,
        taxId,
        businessCategory,
        description,
        documentUrl: documentFileName ? `docs/vendors/${documentFileName}` : '',
        isApproved: true,
      };
    }

    onSubmit?.({
      email,
      password,
      firstName,
      lastName,
      role,
      vendorProfile,
      agreementAccepted: true,
    });
  };

  const isSeller = role === 'seller';

  return (
    <>
      <form className="space-y-4 w-full" onSubmit={handleSubmit}>
        {/* Role Selection (Only Customer and Seller / Vendor) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Select Registration Role
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setRole('customer');
                setAgreementAccepted(false);
              }}
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                role === 'customer'
                  ? 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-500/20 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <UserOutlined className="text-sm text-blue-600" />
              <span>Customer</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRole('seller');
                setAgreementAccepted(false);
              }}
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                role === 'seller'
                  ? 'bg-orange-50 border-orange-500 text-orange-950 ring-2 ring-orange-500/20 shadow-sm font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ShopOutlined className="text-sm text-orange-600" />
              <span>Seller / Vendor</span>
            </button>
          </div>
        </div>

        {/* First & Last Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="firstName" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              placeholder="Karma"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-all text-sm disabled:opacity-60"
              required
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="lastName" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              placeholder="Sherpa"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-all text-sm disabled:opacity-60"
              required
            />
          </div>
        </div>

        {/* Email Input */}
        <div className="space-y-1">
          <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            placeholder={isSeller ? 'vendor@himalayashop.com' : 'buyer@example.com'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-all text-sm disabled:opacity-60"
            required
          />
        </div>

        {/* Password Input */}
        <div className="space-y-1">
          <label htmlFor="password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="w-full px-3.5 pr-10 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-all text-sm disabled:opacity-60"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* SELLER SPECIFIC FIELDS (Vendor Profile) */}
        {role === 'seller' && (
          <div className="p-4 bg-orange-50/60 border border-orange-200/80 rounded-2xl space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 border-b border-orange-200/60 pb-2">
              <span className="p-1.5 bg-orange-500 text-white rounded-lg text-xs flex items-center justify-center">
                <ShopOutlined />
              </span>
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Vendor & Store Information
                </h4>
                <p className="text-[11px] text-slate-500">
                  Official store credentials, physical address, and verification details
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700 uppercase">
                  Vendor / Store Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Himalaya Pure Herbs & Teas"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  required={role === 'seller'}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-900 text-xs focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700 uppercase">
                  Business Phone / WhatsApp *
                </label>
                <input
                  type="tel"
                  placeholder="+977 9801234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required={role === 'seller'}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-900 text-xs focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700 uppercase">
                  Business Location / Address *
                </label>
                <input
                  type="text"
                  placeholder="Thamel Marg, Kathmandu, Nepal"
                  value={businessLocation}
                  onChange={(e) => setBusinessLocation(e.target.value)}
                  required={role === 'seller'}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-900 text-xs focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700 uppercase">
                  PAN / Tax Registration ID *
                </label>
                <input
                  type="text"
                  placeholder="PAN-601928374"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  required={role === 'seller'}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-900 text-xs focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700 uppercase">
                Business Category
              </label>
              <select
                value={businessCategory}
                onChange={(e) => setBusinessCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-900 text-xs focus:outline-none focus:border-slate-400"
              >
                <option value="Handicrafts & Woolens">Handicrafts & Woolens</option>
                <option value="Organic Teas & Herbs">Organic Teas & Herbs</option>
                <option value="Apparel & Mountain Wear">Apparel & Mountain Wear</option>
                <option value="Singing Bowls & Meditation">Singing Bowls & Meditation</option>
                <option value="Jewelry & Gemstones">Jewelry & Gemstones</option>
                <option value="Electronics & Accessories">Electronics & Accessories</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700 uppercase">
                Store Bio / Description
              </label>
              <textarea
                rows={2}
                placeholder="Tell buyers about your craftsmanship, origin and heritage..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-900 text-xs focus:outline-none focus:border-slate-400 resize-none"
              />
            </div>

            {/* Business Document Upload */}
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700 uppercase">
                Business Registration Certificate / Document
              </label>
              <div className="relative border-2 border-dashed border-orange-300 rounded-xl p-3 bg-white hover:bg-orange-50/30 transition-colors text-center cursor-pointer">
                <input
                  type="file"
                  onChange={handleDocumentChange}
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-orange-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                  </svg>
                  {documentFileName ? (
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                      <PaperClipOutlined className="text-emerald-600" /> Attached: {documentFileName}
                    </span>
                  ) : (
                    <>
                      <span className="text-xs font-medium text-slate-700">
                        Upload Certificate or Tax ID doc (PDF, PNG, JPG)
                      </span>
                      <span className="text-[10px] text-slate-400">Click or drag file to attach</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MANDATORY AGREEMENT SECTION
           ========================================================================= */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex items-start gap-2.5">
            <input
              id="agreement-checkbox"
              type="checkbox"
              checked={agreementAccepted}
              onChange={(e) => {
                setAgreementAccepted(e.target.checked);
                if (e.target.checked) setAgreementError(null);
              }}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-orange-600 focus:outline-none cursor-pointer shrink-0"
            />
            <label htmlFor="agreement-checkbox" className="text-xs text-slate-700 select-none cursor-pointer leading-relaxed">
              {isSeller ? (
                <>
                  I have read and agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setIsAgreementModalOpen(true)}
                    className="font-bold text-orange-600 hover:text-orange-700 underline focus:outline-none cursor-pointer"
                  >
                    Vendor Marketplace Agreement (v1.0)
                  </button>
                  , Merchant Quality Standards, and 8% Marketplace Commission Schedule.
                </>
              ) : (
                <>
                  I have read and agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setIsAgreementModalOpen(true)}
                    className="font-bold text-blue-600 hover:text-blue-700 underline focus:outline-none cursor-pointer"
                  >
                    Customer Terms of Service & Privacy Notice
                  </button>
                  , Buyer Protection Guarantee, and Return Guidelines.
                </>
              )}
            </label>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
            <span>Agreement Version: 1.0 (Nov 2026)</span>
            <button
              type="button"
              onClick={() => setIsAgreementModalOpen(true)}
              className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer inline-flex items-center gap-1"
            >
              <FileTextOutlined /> Review Legal Terms
            </button>
          </div>
        </div>

        {/* Agreement Error Message */}
        {agreementError && (
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
            <WarningOutlined className="text-amber-600 text-sm shrink-0" />
            <span className="font-medium">{agreementError}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5 text-red-600 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 shrink-0 mt-0.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-slate-900 text-white font-semibold py-3 px-4 rounded-xl hover:bg-slate-800 focus:outline-none disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-slate-900/10 hover:shadow-lg mt-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Creating {role} account...</span>
            </>
          ) : (
            <span>Create {role.charAt(0).toUpperCase() + role.slice(1)} Account</span>
          )}
        </button>

        {/* Sign In link */}
        {onLoginClick && (
          <div className="text-center mt-3">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onLoginClick}
                className="font-semibold text-orange-600 hover:text-orange-500 hover:underline transition-colors focus:outline-none cursor-pointer"
              >
                Sign In
              </button>
            </p>
          </div>
        )}
      </form>

      {/* =========================================================================
          FULL AGREEMENT MODAL DIALOG (TOP-10 POSITIONED & SMOOTH TRANSFORMATION)
         ========================================================================= */}
      {isAgreementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl mt-10 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-orange-100 text-orange-600 rounded-xl text-lg flex items-center justify-center">
                  <SafetyCertificateOutlined />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {isSeller
                      ? 'Himalaya Online Shop — Vendor Marketplace Agreement'
                      : 'Himalaya Online Shop — Customer Terms of Service'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Effective Date: November 15, 2026 · Version 1.0</p>
                </div>
              </div>
              <button
                onClick={() => setIsAgreementModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-lg cursor-pointer"
              >
                <CloseOutlined className="text-sm" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed font-sans">
              {isSeller ? (
                <>
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-orange-950 font-medium flex items-start gap-2">
                    <AuditOutlined className="text-orange-600 mt-0.5 shrink-0" />
                    <div>
                      <strong>Vendor Obligations:</strong> As an authorized merchant on the Himalaya Online Shop, you represent that all goods offered are authentic, legally sourced, and accurately described with verifiable origin.
                    </div>
                  </div>

                  <h4 className="font-bold text-slate-800 text-sm">1. Store Registration & Approval</h4>
                  <p>
                    Vendors must provide valid tax documentation (PAN/VAT), government identity, and accurate physical location. The platform reserves the right to verify premises and inventory records prior to releasing order payouts.
                  </p>

                  <h4 className="font-bold text-slate-800 text-sm">2. Commission & Settlement Terms</h4>
                  <p>
                    Himalaya Online Shop charges an 8% platform facilitation commission on delivered orders. Payouts are reconciled and disbursed bi-weekly directly to the registered vendor bank account following the expiration of the 7-day buyer return window.
                  </p>

                  <h4 className="font-bold text-slate-800 text-sm">3. Order Fulfillment & Shipping SLAs</h4>
                  <p>
                    Merchants must confirm order dispatch within 48 hours of purchase. In the event of stock unavailability, merchants must update inventory statuses promptly to avoid order cancellations and penalties.
                  </p>

                  <h4 className="font-bold text-slate-800 text-sm">4. Customer Disputes & Refunds</h4>
                  <p>
                    In the event of defective or counterfeit claims, the vendor bears full liability for return shipping costs and complete buyer refunds. Persistent non-compliance will lead to vendor store termination.
                  </p>
                </>
              ) : (
                <>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-950 font-medium flex items-start gap-2">
                    <SafetyCertificateOutlined className="text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <strong>Customer Guarantee:</strong> Himalaya Online Shop guarantees genuine Himalayan products, secure escrow payments, and comprehensive buyer protection across Nepal and worldwide delivery.
                    </div>
                  </div>

                  <h4 className="font-bold text-slate-800 text-sm">1. User Accounts & Security</h4>
                  <p>
                    Customers are responsible for maintaining confidentiality of credentials, including password and registered FIDO2 passkeys. You agree to notify us immediately of any unauthorized account access.
                  </p>

                  <h4 className="font-bold text-slate-800 text-sm">2. Payments & Order Pricing</h4>
                  <p>
                    All prices are inclusive of applicable sales taxes unless specified otherwise. We support Credit/Debit Cards, Cash on Delivery, and Escrow digital wallets.
                  </p>

                  <h4 className="font-bold text-slate-800 text-sm">3. Returns & Refunds</h4>
                  <p>
                    Unused, original-packaging items are eligible for returns within 7 calendar days from delivery. Full refunds are processed within 3-5 business days upon item inspection.
                  </p>

                  <h4 className="font-bold text-slate-800 text-sm">4. Privacy & Data Protection</h4>
                  <p>
                    Personal data, delivery addresses, and payment tokens are protected using industry-standard TLS encryption and never sold to third-party advertisers.
                  </p>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                By clicking "I Understand & Accept", you agree to be legally bound by these terms.
              </span>
              <button
                type="button"
                onClick={() => {
                  setAgreementAccepted(true);
                  setAgreementError(null);
                  setIsAgreementModalOpen(false);
                }}
                className="bg-slate-900 text-white font-semibold text-xs px-4 py-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                I Understand & Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
