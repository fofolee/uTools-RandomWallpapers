#!/bin/bash

bg_path=$1

function set_with_third_part_tools() {
  if type feh > /dev/null 2>&1; then
    feh --conversion-timeout 5 --bg-fill -z "$1"
  elif type nitrogen > /dev/null 2>&1; then
    nitrogen --set-zoom-fill "$1"
  fi
}

# Detect desktop environment
if [ "$XDG_CURRENT_DESKTOP" = "" ]; then
  desktop=$(echo "$XDG_DATA_DIRS" | sed 's/.*\(xfce\|kde\|gnome\).*/\1/')
else
  desktop=$XDG_CURRENT_DESKTOP
fi
desktop=${desktop,,} # convert to lower case

# Set Wallpaper
case $desktop in
  # For DDE (Deepin)
  dde)
    gsettings set "com.deepin.wrap.gnome.desktop.background picture-uri $bg_path"
    ;;
  gnome)
    # For distributions using Gnome (like Ubuntu)
    gsettings set "org.gnome.desktop.background picture-uri file:///$bg_path"
    ;;
  kde)
    # For those who useing KDE (like Manjaro)
    cmd='var allDesktops = desktops();print (allDesktops);for (i=0;i<allDesktops.length;i++) {d = allDesktops[i];d.wallpaperPlugin = "org.kde.image";d.currentConfigGroup = Array("Wallpaper", "org.kde.image", "General");d.writeConfig("Image", "file://'"$bg_path"'/")}'
    qdbus org.kde.plasmashell /PlasmaShell org.kde.PlasmaShell.evaluateScript "$cmd"
    ;;
  xfce)
    xfconf-query --channel xfce4-desktop --property /backdrop/screen0/monitor0/image-path --set "$bg_path"
    ;;
  mate)
    pcmanfm -w "$bg_path"
    ;;
  *)
    # In other WM/DE, detect tools which can set wallpaper automatically.
    set_with_third_part_tools "$bg_path"
    ;;
esac
