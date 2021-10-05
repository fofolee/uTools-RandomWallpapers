using System;
using System.Runtime.InteropServices;
using Microsoft.Win32;
namespace Wallpaper
{
	public class Setter {
		public const int	SetDesktopWallpaper	= 20;
		public const int	UpdateIniFile		= 0x01;
		public const int	SendWinIniChange	= 0x02;
		[DllImport( "user32.dll", SetLastError = true, CharSet = CharSet.Auto )]
		private static extern int SystemParametersInfo( int uAction, int uParam, string lpvParam, int fuWinIni );

		public static void SetWallpaper( string path )
		{
			SystemParametersInfo( SetDesktopWallpaper, 0, path, UpdateIniFile | SendWinIniChange );
		}
	}
}