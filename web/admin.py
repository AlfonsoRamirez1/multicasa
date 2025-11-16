from django.contrib import admin
from .models import Casa, ImagenCasa  # Importamos nuestros modelos


# Esta clase nos permitirá añadir/editar imágenes DESDE el admin de Casa
class ImagenCasaInline(admin.StackedInline):
    model = ImagenCasa
    extra = 1  # Cuántos formularios de imagen mostrar por defecto


# Esta es la configuración principal para el modelo Casa
class CasaAdmin(admin.ModelAdmin):
    # Qué campos mostrar en la lista de casas
    list_display = ('titulo', 'precio', 'estatus', 'habitaciones', 'banos')

    # Qué campos se pueden usar para filtrar en el admin
    list_filter = ('estatus', 'precio')

    # Qué campos se pueden usar para buscar
    search_fields = ('titulo', 'descripcion')

    # Agrega el editor de imágenes 'en línea' dentro del editor de Casa
    inlines = [ImagenCasaInline]


# --- Registramos los modelos en el admin ---
admin.site.register(Casa, CasaAdmin)
# Nota: No registramos ImagenCasa por separado, ya que la estamos manejando
# 'dentro' de Casa. Si quisieras administrarla por separado,
# simplemente añade: admin.site.register(ImagenCasa)