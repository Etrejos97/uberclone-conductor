export default {
  'common.loading': 'Cargando...',
  'common.comingSoon': 'Esta pantalla se construye en un paso siguiente.',
  'common.retry': 'Reintentar',
  'common.select': 'Seleccionar...',
  'common.chooseDate': 'Elegir fecha',

  // --- Registro ---
  'registration.personal': 'Datos personales',
  'registration.vehicle': 'Vehículo',
  'registration.documents': 'Documentos y pagos',
  'registration.demoDriver': 'Entrar con un conductor de prueba',
  'registration.submit': 'Enviar registro',
  'registration.submitting': 'Enviando...',
  'registration.successTitle': 'Registro enviado',
  'registration.successMessage':
    'Tu cuenta está pendiente de aprobación. Te avisaremos cuando esté lista.',

  // Pestaña 1: datos personales
  'field.profilePhoto': 'Foto de perfil',
  'field.fullName': 'Nombre completo',
  'field.documentNumber': 'Número de cédula',
  'field.phone': 'Teléfono (10 dígitos)',
  'field.birthDate': 'Fecha de nacimiento',
  'field.gender': 'Género',
  'field.email': 'Correo electrónico',

  // Pestaña 2: vehículo
  'field.category': 'Categoría del vehículo',
  'field.plate': 'Placa (ej. ABC123)',
  'field.brand': 'Marca',
  'field.model': 'Modelo',
  'field.year': 'Año del vehículo',
  'field.color': 'Color',
  'field.capacity': 'Capacidad (pasajeros)',
  'field.vehiclePhoto': 'Foto del vehículo',

  // Pestaña 3: documentos
  'field.licenseNumber': 'Número de licencia de conducción',
  'field.licensePhoto': 'Foto de la licencia',
  'field.licenseExpiresAt': 'Vencimiento de la licencia',
  'field.soatPhoto': 'Foto del SOAT',
  'field.soatExpiresAt': 'Vencimiento del SOAT',
  'field.techInspectionPhoto': 'Foto de la revisión técnico-mecánica',
  'field.techInspectionExpiresAt': 'Vencimiento de la técnico-mecánica',
  'field.mercadoPagoEmail': 'Correo de Mercado Pago',
  'field.termsAccepted':
    'Acepto los términos y condiciones y la comisión del {commissionRate}%',

  // Opciones de listas desplegables (en Firestore quedan en inglés — RNF-14)
  'gender.female': 'Mujer',
  'gender.male': 'Hombre',
  'gender.other': 'Otro',
  'gender.undisclosed': 'Prefiero no decir',

  'category.economy': 'Economy',
  'category.xl': 'XL',
  'category.premium': 'Premium',

  'color.white': 'Blanco',
  'color.black': 'Negro',
  'color.gray': 'Gris oscuro',
  'color.silver': 'Gris plata',
  'color.red': 'Rojo',
  'color.blue': 'Azul',
  'color.green': 'Verde',
  'color.other': 'Otro',

  // Fotos
  'photo.none': 'Sin foto',
  'photo.camera': 'Cámara',
  'photo.gallery': 'Galería',

  // --- Menú ---
  'menu.home': 'Inicio',
  'menu.history': 'Historial',
  'menu.earnings': 'Ganancias',
  'menu.profile': 'Perfil',
  'menu.settings': 'Configuración',
  'menu.simulator': 'Cliente simulado',

  // --- Viaje ---
  'trip.inProgress': 'Viaje en curso',
  'trip.goToPayment': 'Ir al cobro',
  'payment.title': 'Cobro',

  // --- Historial ---
  'history.list': 'Historial',
  'history.detail': 'Detalle del viaje',
  'history.openDetail': 'Ver un detalle de ejemplo',

  // --- Configuración ---
  'settings.language': 'Idioma',
  'settings.spanish': 'Español',
  'settings.english': 'Inglés',
  'settings.logout': 'Cerrar sesión',

  // --- Errores ---
  'errors.sessionReadFailed': 'No pude leer tu sesión en este teléfono.',
  'errors.cameraDenied':
    'Permiso de cámara denegado. Habilítalo en los ajustes del teléfono.',
  'errors.photoPickFailed': 'No se pudo abrir la cámara o la galería.',

  // Errores de validación (VA-01 a VA-20)
  'errors.required': 'Este campo es obligatorio.',
  'errors.nameInvalid': 'Solo letras y espacios.',
  'errors.nameTooLong': 'Máximo {maxName} caracteres.',
  'errors.idNumberInvalid': 'Debe tener entre 6 y 10 dígitos.',
  'errors.phoneInvalid': 'Debe tener exactamente 10 dígitos.',
  'errors.underage': 'Debes tener al menos {minAge} años.',
  'errors.optionInvalid': 'Elige una opción de la lista.',
  'errors.emailInvalid': 'Correo electrónico no válido.',
  'errors.plateInvalid': 'Formato inválido. Ejemplo: ABC123.',
  'errors.textTooLong': 'Máximo {maxText} caracteres.',
  'errors.yearInvalid': 'Ingresa un año de 4 dígitos.',
  'errors.yearInFuture': 'El año no puede ser futuro.',
  'errors.capacityInvalid': 'Ingresa un número entero mayor que cero.',
  'errors.xlCapacity': 'Los vehículos XL necesitan al menos {xlMin} puestos.',
  'errors.photoRequired': 'Agrega una foto.',
  'errors.photoTooLarge': 'La foto supera los {maxPhotoMb} MB. Elige una más pequeña.',
  'errors.expired': 'El documento ya venció. Verifica la fecha.',
  'errors.termsRequired': 'Debes aceptar los términos para continuar.',
};
