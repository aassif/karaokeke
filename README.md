# Karaokéké 🎉

## Dépendances

* [php](https://php.net/) (>= 8.1.1)
* [yt-dlp](https://github.com/yt-dlp/yt-dlp/) (>= 2021.12.27)
* [Bootstrap](https://getbootstrap.com/) (>= 5.1.3)
* [Bootstrap Icons](https://icons.getbootstrap.com/) (>= 1.7.0)
* [CryptoJS](https://github.com/brix/crypto-js/) (>= 4.1.1)

### yt-dlp

La commande `yt-dlp` doit être disponible à l'éxecution.\
Il suffit d'installer le logiciel comme indiqué [ici](https://github.com/yt-dlp/yt-dlp#installation).

### Bootstrap et Bootstrap Icons

La bibliothèque *Bootstrap* doit être présente dans un sous-répertoire nommé `bootstrap`.\
Il faut donc extraire le contenu de l'archive dans le répertoire principal et renommer le répertoire créé.

Idem pour *Boostrap Icons* qui doit se trouver dans `bootstrap-icons`.

### CryptoJS

La bibliothèque doit être téléchargée [ici](https://github.com/brix/crypto-js/tags)
puis extraite dans un répertoire nommé `crypto-js`.

## Démarrage

Dans un terminal, accédez au répertoire de l'application puis lancez la commande :
```
php -S localhost:5000
```

Dans un navigateur, tapez `localhost:5000` dans la barre d'adresse.

## Utilisation

La fenêtre principale (💻) permet d'éditer les morceaux, d'en ajouter de nouveaux et de déclencher leur lecture.
Dès son ouverture, la fenêtre principale ouvre une fenêtre secondaire (🎤) dans laquelle seront joués les titres.
Cette seconde fenêtre a vocation à être utilisée en retour ou projetée.
