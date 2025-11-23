from django.contrib import admin
from django import forms
from django.utils.safestring import mark_safe
from .models import Casa, ImagenCasa, ImagenBase


# =========================
# FORMULARIO ImagenBase
# =========================
class ImagenBaseForm(forms.ModelForm):
    archivo_imagen = forms.ImageField(
        required=True,
        help_text="Selecciona una imagen para agregar a la galería central (máximo 2MB)"
    )

    class Meta:
        model = ImagenBase
        fields = ['archivo_imagen', 'nombre', 'categoria']

    def clean_archivo_imagen(self):
        archivo_imagen = self.cleaned_data.get('archivo_imagen')
        if archivo_imagen and archivo_imagen.size > 2 * 1024 * 1024:
            raise forms.ValidationError("La imagen es demasiado grande. Máximo 2MB permitido.")
        return archivo_imagen

    def save(self, commit=True):
        instance = super().save(commit=False)

        archivo_imagen = self.cleaned_data.get('archivo_imagen')
        if archivo_imagen:
            instance.imagen_data = archivo_imagen.read()
            instance.tipo_contenido = archivo_imagen.content_type
            if not instance.nombre:
                instance.nombre = archivo_imagen.name

        if commit:
            instance.save()
        return instance


# =========================
# ADMIN ImagenBase
# =========================
@admin.register(ImagenBase)
class ImagenBaseAdmin(admin.ModelAdmin):
    form = ImagenBaseForm
    list_display = ['nombre', 'categoria', 'fecha_creacion', 'preview_imagen']
    list_filter = ['categoria', 'fecha_creacion']
    search_fields = ['nombre', 'categoria']
    readonly_fields = ['preview_imagen']

    def preview_imagen(self, obj):
        if obj.get_image_src():
            return mark_safe(
                f'<img src="{obj.get_image_src()}" style="max-width: 100px; max-height: 80px;" />'
            )
        return "No hay imagen"

    preview_imagen.short_description = "Vista previa"


# =========================
# INLINE ImagenCasa
# =========================
class ImagenCasaInline(admin.TabularInline):
    model = ImagenCasa
    extra = 1
    fields = ['imagen_base', 'texto_alternativo', 'orden']
    autocomplete_fields = ['imagen_base']


# =========================
# FORMULARIO Casa + JS MAPA
# =========================
class CasaAdminForm(forms.ModelForm):
    class Meta:
        model = Casa
        fields = '__all__'

    class Media:
        # Ruta en /static  →  static/js/casa_map.js
        js = (
            'js/casa_map.js',
        )


# =========================
# ADMIN Casa
# =========================
@admin.register(Casa)
class CasaAdmin(admin.ModelAdmin):
    form = CasaAdminForm
    # Template que solo carga Leaflet (sin otro <div id="casa-map">)
    change_form_template = 'casa_change_form.html'

    list_display = [
        'titulo', 'precio', 'municipio', 'estado',
        'estatus', 'fecha_publicacion', 'tiene_coordenadas'
    ]
    list_filter = ['estatus', 'estado', 'municipio', 'precio', 'fecha_publicacion']
    search_fields = ['titulo', 'descripcion', 'direccion', 'municipio', 'estado', 'codigo_postal']
    inlines = [ImagenCasaInline]
    readonly_fields = ['tiene_coordenadas', 'mapa_ubicacion']

    fieldsets = [
        ('Información Básica', {
            'fields': ['titulo', 'descripcion', 'precio', 'estatus']
        }),
        ('Ubicación', {
            'fields': [
                'direccion', 'municipio', 'estado',
                'codigo_postal', 'latitud', 'longitud',
                'tiene_coordenadas', 'mapa_ubicacion'
            ],
            'description': (
                'Escribe la dirección (calle, municipio, estado, CP) y usa el botón para '
                'obtener las coordenadas, o haz clic en el mapa para rellenar los campos.'
            )
        }),
        ('Características', {
            'fields': ['habitaciones', 'banos', 'superficie_m2']
        }),
    ]

    def tiene_coordenadas(self, obj):
        return "✅ Sí" if obj.latitud and obj.longitud else "❌ No"
    tiene_coordenadas.short_description = "Coordenadas automáticas"

    def mapa_ubicacion(self, obj=None):
        # Contenedor del botón y el mapa; va justo debajo de "Coordenadas automáticas"
        return mark_safe("""
            <p style="font-size:12px;color:#555;">
                Haz clic en el mapa para fijar la ubicación, o escribe la dirección y usa
                el botón para obtener las coordenadas automáticamente.
            </p>
            <button type="button" class="button" id="btn-geocode-direccion">
                Obtener coordenadas desde dirección
            </button>
            <div id="casa-map"
                 style="width:100%; height:260px; border:1px solid #ccc; margin-top:10px;"></div>
        """)
    mapa_ubicacion.short_description = "Mapa de ubicación"


# =========================
# ADMIN ImagenCasa
# =========================
@admin.register(ImagenCasa)
class ImagenCasaAdmin(admin.ModelAdmin):
    list_display = ['casa', 'imagen_base', 'orden', 'texto_alternativo']
    list_filter = ['casa', 'imagen_base__categoria']
    search_fields = ['casa__titulo', 'imagen_base__nombre']
    autocomplete_fields = ['casa', 'imagen_base']
    readonly_fields = ['preview_imagen']

    def preview_imagen(self, obj):
        if obj.get_image_src():
            return mark_safe(
                f'<img src="{obj.get_image_src()}" style="max-width: 300px; max-height: 200px;" />'
            )
        return "No hay imagen"

    preview_imagen.short_description = "Vista previa"
