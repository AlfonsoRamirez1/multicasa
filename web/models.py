from django.db import models
from django.contrib.auth.models import User


# -------------------------------------------------------------------
# ACLARACIÓN IMPORTANTE:
# No creamos un modelo 'Usuarios' porque Django ya nos da uno: 'User'.
# Este modelo 'User' (importado arriba) ya tiene email, password,
# nombre, y todo lo necesario para la autenticación y el panel admin.
# ¡Usaremos este modelo integrado!
# -------------------------------------------------------------------


class Casa(models.Model):
    """
    Modelo que representa una propiedad o vivienda en la base de datos.
    """

    # Opciones para el campo 'estatus' (replica el ENUM de MySQL)
    ESTATUS_CHOICES = [
        ('en venta', 'En Venta'),
        ('vendida', 'Vendida'),
    ]

    # --- Campos Principales ---
    id_casa = models.AutoField(primary_key=True)
    titulo = models.CharField(max_length=255)
    descripcion = models.TextField(null=True, blank=True)  # Permite que esté vacío
    precio = models.DecimalField(max_digits=10, decimal_places=2)

    # --- Campos de Ubicación ---
    direccion = models.CharField(max_length=255, null=True, blank=True)
    latitud = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    longitud = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)

    # --- Campos de Estatus y Características (Opción A) ---
    estatus = models.CharField(max_length=10, choices=ESTATUS_CHOICES, default='en venta')
    habitaciones = models.IntegerField(null=True, blank=True)
    banos = models.IntegerField(null=True, blank=True)
    superficie_m2 = models.IntegerField(null=True, blank=True)

    # --- Campo de Fecha (Auto-gestionado) ---
    fecha_publicacion = models.DateTimeField(auto_now_add=True)  # Se añade la fecha automáticamente al crear

    def __str__(self):
        """
        Esto define cómo se verá el objeto en el panel de administración de Django.
        """
        return self.titulo

    class Meta:
        # Opcional: Para que en el admin se vea bien en español
        verbose_name = "Casa"
        verbose_name_plural = "Casas"


class ImagenCasa(models.Model):
    """
    Modelo para almacenar las múltiples imágenes de una casa.
    Relacionado 1-a-N con la tabla Casa.
    """
    id_imagen = models.AutoField(primary_key=True)

    # --- Relación (Llave Foránea) ---
    # Esto crea la columna 'id_casa_fk' automáticamente.
    casa = models.ForeignKey(Casa, on_delete=models.CASCADE, related_name='imagenes')

    # --- Campos de la Imagen ---
    # Usamos ImageField para que Django gestione la subida de archivos
    imagen = models.ImageField(upload_to='casas_imagenes/', help_text="Imagen de la propiedad")
    texto_alternativo = models.CharField(max_length=100, null=True, blank=True)
    orden = models.IntegerField(default=0)

    def __str__(self):
        return f"Imagen de {self.casa.titulo} (Orden: {self.orden})"

    class Meta:
        verbose_name = "Imagen de Casa"
        verbose_name_plural = "Imágenes de Casas"
        ordering = ['orden']  # Muestra las imágenes ordenadas por defecto
