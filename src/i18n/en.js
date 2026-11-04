export default {
  'common.loading': 'Loading...',
  'common.comingSoon': 'This screen is built in a later step.',
  'common.retry': 'Retry',
  'common.select': 'Select...',
  'common.chooseDate': 'Choose date',

  // --- Registration ---
  'registration.personal': 'Personal info',
  'registration.vehicle': 'Vehicle',
  'registration.documents': 'Documents and payments',
  'registration.demoDriver': 'Enter with a test driver',
  'registration.submit': 'Submit registration',
  'registration.submitting': 'Submitting...',
  'registration.successTitle': 'Registration submitted',
  'registration.successMessage':
    'Your account is pending approval. We will notify you when it is ready.',

  // Tab 1: personal data
  'field.profilePhoto': 'Profile photo',
  'field.fullName': 'Full name',
  'field.documentNumber': 'ID number',
  'field.phone': 'Phone (10 digits)',
  'field.birthDate': 'Date of birth',
  'field.gender': 'Gender',
  'field.email': 'Email address',

  // Tab 2: vehicle
  'field.category': 'Vehicle category',
  'field.plate': 'Plate (e.g. ABC123)',
  'field.brand': 'Brand',
  'field.model': 'Model',
  'field.year': 'Vehicle year',
  'field.color': 'Color',
  'field.capacity': 'Capacity (passengers)',
  'field.vehiclePhoto': 'Vehicle photo',

  // Tab 3: documents
  'field.licenseNumber': "Driver's license number",
  'field.licensePhoto': 'License photo',
  'field.licenseExpiresAt': 'License expiry date',
  'field.soatPhoto': 'SOAT photo',
  'field.soatExpiresAt': 'SOAT expiry date',
  'field.techInspectionPhoto': 'Technical inspection photo',
  'field.techInspectionExpiresAt': 'Technical inspection expiry date',
  'field.mercadoPagoEmail': 'Mercado Pago email',
  'field.termsAccepted':
    'I accept the terms and conditions and the {commissionRate}% commission',

  // Dropdown options (stored in English in Firestore — RNF-14)
  'gender.female': 'Female',
  'gender.male': 'Male',
  'gender.other': 'Other',
  'gender.undisclosed': 'Prefer not to say',

  'category.economy': 'Economy',
  'category.xl': 'XL',
  'category.premium': 'Premium',

  'color.white': 'White',
  'color.black': 'Black',
  'color.gray': 'Dark gray',
  'color.silver': 'Silver',
  'color.red': 'Red',
  'color.blue': 'Blue',
  'color.green': 'Green',
  'color.other': 'Other',

  // Photos
  'photo.none': 'No photo',
  'photo.camera': 'Camera',
  'photo.gallery': 'Gallery',

  // --- Menu ---
  'menu.home': 'Home',
  'menu.history': 'History',
  'menu.earnings': 'Earnings',
  'menu.profile': 'Profile',
  'menu.settings': 'Settings',
  'menu.simulator': 'Simulated rider',

  // --- Trip ---
  'trip.inProgress': 'Trip in progress',
  'trip.goToPayment': 'Go to payment',
  'payment.title': 'Payment',

  // --- History ---
  'history.list': 'History',
  'history.detail': 'Trip details',
  'history.openDetail': 'Open a sample detail',

  // --- Settings ---
  'settings.language': 'Language',
  'settings.spanish': 'Spanish',
  'settings.english': 'English',
  'settings.logout': 'Log out',

  // --- Errors ---
  'errors.sessionReadFailed': "I couldn't read your session on this phone.",
  'errors.cameraDenied':
    'Camera permission denied. Enable it in your phone settings.',
  'errors.photoPickFailed': 'Could not open the camera or gallery.',

  // Validation errors (VA-01 to VA-20)
  'errors.required': 'This field is required.',
  'errors.nameInvalid': 'Letters and spaces only.',
  'errors.nameTooLong': 'Maximum {maxName} characters.',
  'errors.idNumberInvalid': 'Must be between 6 and 10 digits.',
  'errors.phoneInvalid': 'Must be exactly 10 digits.',
  'errors.underage': 'You must be at least {minAge} years old.',
  'errors.optionInvalid': 'Choose an option from the list.',
  'errors.emailInvalid': 'Invalid email address.',
  'errors.plateInvalid': 'Invalid format. Example: ABC123.',
  'errors.textTooLong': 'Maximum {maxText} characters.',
  'errors.yearInvalid': 'Enter a 4-digit year.',
  'errors.yearInFuture': 'The year cannot be in the future.',
  'errors.capacityInvalid': 'Enter a whole number greater than zero.',
  'errors.xlCapacity': 'XL vehicles need at least {xlMin} seats.',
  'errors.photoRequired': 'Add a photo.',
  'errors.photoTooLarge': 'Photo exceeds {maxPhotoMb} MB. Choose a smaller one.',
  'errors.expired': 'The document has expired. Check the date.',
  'errors.termsRequired': 'You must accept the terms to continue.',
};
