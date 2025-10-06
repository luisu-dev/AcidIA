# Configuración de Stripe Checkout

## Variables de entorno requeridas

### Para Vercel (Production)
Agrega estas variables en el dashboard de Vercel:

```
STRIPE_SECRET_KEY=sk_live_tu_clave_secreta_aqui
STRIPE_WEBHOOK_SECRET=whsec_tu_webhook_secret_aqui
ADMIN_EMAIL=tu-email@ejemplo.com
```

### Para desarrollo local (.env.local en widget-landing)
```
VITE_CHECKOUT_ENDPOINT=/api/create-checkout-session
VITE_CATALOG_URL=https://acidia.app/catalog.json
```

## Instalación de dependencias

```bash
# En la raíz del proyecto
npm install

# En widget-landing
cd widget-landing
npm install
```

## Cómo funciona el checkout

1. El usuario agrega productos al carrito
2. Al hacer click en "Ir a Pagar", se envía una petición POST a `/api/create-checkout-session`
3. El backend crea una sesión de Stripe Checkout con los productos
4. Stripe redirige al usuario a la página de pago
5. Después del pago, Stripe redirige de vuelta a acidia.app

## URLs de redirección configuradas

- **Success**: `https://acidia.app/?success=true`
- **Cancel**: `https://acidia.app/?canceled=true`

## Obtener tu Stripe Secret Key

1. Ve a https://dashboard.stripe.com/apikeys
2. Copia tu "Secret key" (empieza con `sk_test_` para testing o `sk_live_` para producción)
3. Agrégala como variable de entorno en Vercel

## Testing en local

Para probar localmente, usa Vercel CLI:

```bash
npm i -g vercel
vercel dev
```

Esto iniciará un servidor local con las funciones serverless funcionando.

## Configurar Webhooks (para recibir notificaciones de pago)

### 1. Crear webhook en Stripe

1. Ve a: https://dashboard.stripe.com/webhooks
2. Click en **"Add endpoint"**
3. **Endpoint URL**: `https://acidia.app/api/stripe-webhook`
4. **Events to send**: Selecciona estos eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Click **"Add endpoint"**
6. Copia el **Signing secret** (empieza con `whsec_`)

### 2. Agregar variables de entorno en Vercel

1. Ve a: `https://vercel.com/[tu-proyecto]/settings/environment-variables`
2. Agrega:
   - `STRIPE_WEBHOOK_SECRET` = El signing secret que copiaste
   - `ADMIN_EMAIL` = Tu email para recibir notificaciones

### 3. Redeploy

Después de agregar las variables, haz redeploy del proyecto.

## Qué sucede cuando un cliente paga

1. ✅ **Cliente completa el pago** en Stripe Checkout
2. 📧 **Stripe envía webhook** a `/api/stripe-webhook`
3. 🔒 **Servidor verifica** que el webhook viene de Stripe
4. 📨 **Se envían correos**:
   - Al **cliente**: Recibo de pago y confirmación
   - A **ti** (admin): Notificación con datos del cliente para onboarding
5. 📊 **Se registra el evento** en los logs de Vercel

## Testing de webhooks en local

Para probar webhooks localmente, usa Stripe CLI:

```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS
# o descarga desde: https://stripe.com/docs/stripe-cli

# Login
stripe login

# Reenviar webhooks a tu servidor local
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

Esto te dará un webhook secret temporal para desarrollo.

## Configurar Resend para enviar correos

### 1. Crear cuenta y obtener API Key

1. Ve a: https://resend.com/signup
2. Verifica tu email
3. Ve a: https://resend.com/api-keys
4. Click **"Create API Key"**
5. Dale un nombre: "AcidIA Production"
6. Copia la API key (empieza con `re_...`)

### 2. Verificar dominio (opcional pero recomendado)

Para enviar desde `@acidia.app` en lugar de `@resend.dev`:

1. Ve a: https://resend.com/domains
2. Click **"Add Domain"**
3. Ingresa: `acidia.app`
4. Agrega los registros DNS que te proporciona Resend
5. Espera verificación (puede tardar unos minutos)

Si no verificas el dominio, los correos se enviarán desde `onboarding@resend.dev` pero funcionarán igual.

### 3. Agregar API key a Vercel

1. Ve a: https://vercel.com/[tu-proyecto]/settings/environment-variables
2. Agrega: `RESEND_API_KEY` = Tu API key de Resend
3. Redeploy el proyecto

### 4. Probar

Haz una compra de prueba en Stripe (modo test) y verifica que lleguen los correos:
- **Cliente**: Recibe correo de bienvenida con detalles del pago
- **Admin**: Recibe notificación con datos para onboarding

## Otros servicios de email (alternativas)

Si prefieres otro servicio:
- [SendGrid](https://sendgrid.com) - Más robusto, 100 correos/día gratis
- [Postmark](https://postmarkapp.com) - Especializado en transaccionales

Actualiza la función `handleSuccessfulPayment` en `/api/stripe-webhook.ts` con tu servicio elegido.
