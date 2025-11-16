from rest_framework import serializers
from .models import Casa, ImagenCasa


class ImagenCasaSerializer(serializers.ModelSerializer):
    """ Serializador para las imágenes de una casa """

    class Meta:
        model = ImagenCasa
        fields = ['imagen', 'texto_alternativo']


class CasaListSerializer(serializers.ModelSerializer):
    """
    Serializador para mostrar la lista de casas en la API.
    """
    # 'imagenes' es el 'related_name' que definimos en el modelo
    imagenes = ImagenCasaSerializer(many=True, read_only=True)

    class Meta:
        model = Casa
        # Definimos los campos que queremos exponer en la API
        fields = [
            'id_casa',
            'titulo',
            'precio',
            'estatus',
            'habitaciones',
            'banos',
            'superficie_m2',
            'imagenes'  # Añadimos las imágenes
        ]