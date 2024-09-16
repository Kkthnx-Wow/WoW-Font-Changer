namespace WoWFontChanger // or WoWFontChanger, depending on your overall structure
{
    static class Program
    {
        /// <summary>
        ///  The main entry point for the application.
        /// </summary>
        [STAThread]
        static void Main()
        {
            Application.SetHighDpiMode(HighDpiMode.SystemAware);
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new WoWFontChanger()); // This should reference the class, not the namespace
        }
    }
}
