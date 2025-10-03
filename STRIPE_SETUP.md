# Configuración de Stripe Checkout

## Variables de entorno requeridas

### Para Vercel (Production)
Agrega estas variables en el dashboard de Vercel:

```
STRIPE_SECRET_KEY=sk_live_tu_clave_secreta_aqui
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
