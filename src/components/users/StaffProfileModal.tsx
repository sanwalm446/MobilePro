import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  User as UserIcon,
  Phone,
  Mail,
  CreditCard,
  MapPin,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Eye,
  Camera,
  Shield,
  FileText,
} from 'lucide-react';
import { User, UserRole, UserStatus } from '../../types';
import { processAndSecureImage } from '../../utils/imageUpload';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

interface StaffProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<User>) => void;
}

export const StaffProfileModal: React.FC<StaffProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  // Active form tab
  const [activeTab, setActiveTab] = useState<'profile' | 'idCard'>('profile');

  // Form state
  const [name, setName] = useState(user.name || '');
  const [username, setUsername] = useState(user.username || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [role, setRole] = useState<UserRole>(user.role);
  const [status, setStatus] = useState<UserStatus>(user.status);
  const [designation, setDesignation] = useState(user.designation || '');
  const [fatherName, setFatherName] = useState(user.fatherName || '');
  const [cnic, setCnic] = useState(user.cnic || '');
  const [dob, setDob] = useState(user.dob || '');
  const [address, setAddress] = useState(user.address || '');
  const [emergencyContact, setEmergencyContact] = useState(user.emergencyContact || '');
  const [joiningDate, setJoiningDate] = useState(user.joiningDate || '');
  const [salary, setSalary] = useState<string>(user.salary ? String(user.salary) : '');

  // Image states
  const [avatarUrl, setAvatarUrl] = useState<string>(user.avatarUrl || '');
  const [cnicFrontUrl, setCnicFrontUrl] = useState<string>(user.cnicFrontUrl || '');
  const [cnicBackUrl, setCnicBackUrl] = useState<string>(user.cnicBackUrl || '');

  // Upload feedback states
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewingImage, setViewingImage] = useState<{ url: string; title: string } | null>(null);

  // File input references
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const cnicFrontInputRef = useRef<HTMLInputElement>(null);
  const cnicBackInputRef = useRef<HTMLInputElement>(null);

  // Generic Image Uploader
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setImageCallback: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsProcessing(true);

    try {
      const result = await processAndSecureImage(file);
      if (result.success && result.dataUrl) {
        setImageCallback(result.dataUrl);
      } else {
        setUploadError(result.error || 'Failed to process image file.');
      }
    } catch (err: any) {
      setUploadError(err.message || 'Error uploading image.');
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  // Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSave({
      name: name.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role,
      status,
      designation: designation.trim(),
      fatherName: fatherName.trim(),
      cnic: cnic.trim(),
      dob: dob || undefined,
      address: address.trim(),
      emergencyContact: emergencyContact.trim(),
      joiningDate: joiningDate || undefined,
      salary: salary ? Number(salary) : undefined,
      avatarUrl: avatarUrl || undefined,
      cnicFrontUrl: cnicFrontUrl || undefined,
      cnicBackUrl: cnicBackUrl || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user.name}
                className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-400 shadow-sm shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 text-white font-black flex items-center justify-center text-lg shrink-0 shadow-sm">
                {user.name[0]}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base tracking-tight text-white">
                  {user.name}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Staff Profile, ID Card & Personal Dossier
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 shrink-0 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'border-emerald-600 text-emerald-800 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Profile & Personal Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('idCard')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'idCard'
                ? 'border-emerald-600 text-emerald-800 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-blue-600" />
            <span>CNIC / Employee ID Card Uploads</span>
            {(cnicFrontUrl || cnicBackUrl) && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {uploadError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* TAB 1: PROFILE DETAILS & PHOTO */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              {/* Photo Upload Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={name}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-500 text-white font-black flex items-center justify-center text-2xl shadow-md">
                      {name ? name[0] : 'S'}
                    </div>
                  )}

                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="absolute -top-1.5 -right-1.5 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow cursor-pointer"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 text-center sm:text-left flex-1">
                  <div className="font-bold text-slate-900 text-sm">
                    Employee Profile Photo
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Supports JPG, PNG, and WebP (up to 5MB). Photo is sanitized and optimized for instant loading.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{avatarUrl ? 'Change Picture' : 'Upload Staff Picture'}</span>
                    </button>
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setViewingImage({ url: avatarUrl, title: `${name}'s Profile Photo` })}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Large</span>
                      </button>
                    )}
                    <input
                      type="file"
                      ref={avatarInputRef}
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleImageUpload(e, setAvatarUrl)}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Personal Information Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Father's Name
                  </label>
                  <input
                    type="text"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    placeholder="e.g. Muhammad Aslam"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mobile Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Emergency / Father Mobile
                  </label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="0321-7654321"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    CNIC / ID Card Number
                  </label>
                  <input
                    type="text"
                    value={cnic}
                    onChange={(e) => setCnic(e.target.value)}
                    placeholder="35201-1234567-1"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Date of Birth (DOB)
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Role & Permissions
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    disabled={user.isMainAdmin}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-bold text-slate-900 disabled:opacity-60"
                  >
                    <option value="SHOP_OWNER">Shop Owner</option>
                    <option value="Admin">Shop Admin / Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Salesman">Salesman</option>
                    <option value="Shop Keeper">Shop Keeper (POS & Sales)</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Employee">Staff / Employee</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Account Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as UserStatus)}
                    disabled={user.isMainAdmin}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-bold text-slate-900 disabled:opacity-60"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending Approval</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Deactivated">Deactivated</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Job Designation
                  </label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Senior Counter Sales Representative"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Monthly Salary (PKR)
                  </label>
                  <input
                    type="number"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder="e.g. 35000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-mono font-bold text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Residential Home Address
                  </label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House # 12, Street 4, Near City Mosque, Lahore"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CNIC / ID CARD UPLOADS */}
          {activeTab === 'idCard' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 flex items-start gap-2.5">
                <CreditCard className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-[11px] leading-relaxed">
                  <div className="font-bold">Staff National Identity Verification (CNIC / Smart Card)</div>
                  <div className="text-blue-700">
                    Upload crisp photos of both Front and Back sides of the staff member's ID card for identity verification, police verification, and HR records.
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* CNIC Front */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">
                      ID Card Front Side
                    </span>
                    {cnicFrontUrl ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Uploaded
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">
                        Missing
                      </span>
                    )}
                  </div>

                  {cnicFrontUrl ? (
                    <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-white">
                      <img
                        src={cnicFrontUrl}
                        alt="CNIC Front"
                        className="w-full h-36 object-contain"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingImage({ url: cnicFrontUrl, title: `${name}'s CNIC Front` })}
                          className="p-1.5 bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                          title="View Full Size"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCnicFrontUrl('')}
                          className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                          title="Delete Front Photo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => cnicFrontInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl h-36 flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-colors bg-white hover:bg-emerald-50/20"
                    >
                      <CreditCard className="w-8 h-8 text-slate-400 mb-1" />
                      <div className="font-bold text-slate-700 text-xs">Click to upload Front</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, or WebP</div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => cnicFrontInputRef.current?.click()}
                      className="w-full py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>{cnicFrontUrl ? 'Replace Front' : 'Upload Front'}</span>
                    </button>
                    <input
                      type="file"
                      ref={cnicFrontInputRef}
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleImageUpload(e, setCnicFrontUrl)}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* CNIC Back */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">
                      ID Card Back Side
                    </span>
                    {cnicBackUrl ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Uploaded
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">
                        Missing
                      </span>
                    )}
                  </div>

                  {cnicBackUrl ? (
                    <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-white">
                      <img
                        src={cnicBackUrl}
                        alt="CNIC Back"
                        className="w-full h-36 object-contain"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingImage({ url: cnicBackUrl, title: `${name}'s CNIC Back` })}
                          className="p-1.5 bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                          title="View Full Size"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCnicBackUrl('')}
                          className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                          title="Delete Back Photo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => cnicBackInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl h-36 flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-colors bg-white hover:bg-emerald-50/20"
                    >
                      <CreditCard className="w-8 h-8 text-slate-400 mb-1" />
                      <div className="font-bold text-slate-700 text-xs">Click to upload Back</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, or WebP</div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => cnicBackInputRef.current?.click()}
                      className="w-full py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>{cnicBackUrl ? 'Replace Back' : 'Upload Back'}</span>
                    </button>
                    <input
                      type="file"
                      ref={cnicBackInputRef}
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleImageUpload(e, setCnicBackUrl)}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>

      {/* Lightbox Image Preview Modal */}
      {viewingImage && (
        <div
          className="fixed inset-0 z-60 bg-slate-950/90 flex items-center justify-center p-4"
          onClick={() => setViewingImage(null)}
        >
          <div className="max-w-3xl max-h-[90vh] flex flex-col items-center">
            <div className="flex items-center justify-between w-full text-white pb-2">
              <span className="font-bold text-sm">{viewingImage.title}</span>
              <button
                type="button"
                onClick={() => setViewingImage(null)}
                className="p-1 hover:bg-white/20 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>
            <img
              src={viewingImage.url}
              alt="Preview"
              className="max-h-[80vh] w-auto object-contain rounded-xl border border-slate-700 shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
