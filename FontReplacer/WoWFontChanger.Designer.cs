namespace WoWFontChanger
{
    partial class WoWFontChanger
    {
        private System.ComponentModel.IContainer components = null;

        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        private void InitializeComponent()
        {
            System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(WoWFontChanger));
            lblDropArea = new Label();
            chkUIFont = new CheckBox();
            chkNormalFont = new CheckBox();
            chkHugeFont = new CheckBox();
            chkQuestFont = new CheckBox();
            btnReplace = new Button();
            btnBrowse = new Button();
            txtWoWPath = new TextBox();
            lblLoadedFont = new Label();
            label1 = new Label();
            pictureBox1 = new PictureBox();
            btnRestoreDefaults = new Button();
            ((System.ComponentModel.ISupportInitialize)pictureBox1).BeginInit();
            SuspendLayout();
            // 
            // lblDropArea
            // 
            lblDropArea.AutoSize = true;
            lblDropArea.Font = new Font("Arial Black", 15.75F, FontStyle.Bold, GraphicsUnit.Point, 0);
            lblDropArea.ForeColor = SystemColors.ButtonShadow;
            lblDropArea.Location = new Point(24, 21);
            lblDropArea.Name = "lblDropArea";
            lblDropArea.Size = new Size(307, 30);
            lblDropArea.TabIndex = 0;
            lblDropArea.Text = "Drag and Drop Fonts Here";
            // 
            // chkUIFont
            // 
            chkUIFont.AutoSize = true;
            chkUIFont.Font = new Font("Arial", 12F, FontStyle.Regular, GraphicsUnit.Point, 0);
            chkUIFont.Location = new Point(31, 77);
            chkUIFont.Name = "chkUIFont";
            chkUIFont.Size = new Size(114, 22);
            chkUIFont.TabIndex = 1;
            chkUIFont.Text = "Main UI Font";
            chkUIFont.UseVisualStyleBackColor = true;
            // 
            // chkNormalFont
            // 
            chkNormalFont.AutoSize = true;
            chkNormalFont.Font = new Font("Arial", 12F, FontStyle.Regular, GraphicsUnit.Point, 0);
            chkNormalFont.Location = new Point(31, 105);
            chkNormalFont.Name = "chkNormalFont";
            chkNormalFont.Size = new Size(179, 22);
            chkNormalFont.TabIndex = 2;
            chkNormalFont.Text = "Normal Numbers Font";
            chkNormalFont.UseVisualStyleBackColor = true;
            // 
            // chkHugeFont
            // 
            chkHugeFont.AutoSize = true;
            chkHugeFont.Font = new Font("Arial", 12F, FontStyle.Regular, GraphicsUnit.Point, 0);
            chkHugeFont.Location = new Point(31, 133);
            chkHugeFont.Name = "chkHugeFont";
            chkHugeFont.Size = new Size(166, 22);
            chkHugeFont.TabIndex = 3;
            chkHugeFont.Text = "Huge Numbers Font";
            chkHugeFont.UseVisualStyleBackColor = true;
            // 
            // chkQuestFont
            // 
            chkQuestFont.AutoSize = true;
            chkQuestFont.Font = new Font("Arial", 12F, FontStyle.Regular, GraphicsUnit.Point, 0);
            chkQuestFont.Location = new Point(31, 161);
            chkQuestFont.Name = "chkQuestFont";
            chkQuestFont.Size = new Size(134, 22);
            chkQuestFont.TabIndex = 4;
            chkQuestFont.Text = "Quest Log Font";
            chkQuestFont.UseVisualStyleBackColor = true;
            // 
            // btnReplace
            // 
            btnReplace.Location = new Point(31, 241);
            btnReplace.Name = "btnReplace";
            btnReplace.Size = new Size(138, 36);
            btnReplace.TabIndex = 7;
            btnReplace.Text = "Replace Fonts";
            btnReplace.UseVisualStyleBackColor = true;
            btnReplace.Click += btnReplace_Click;
            // 
            // btnBrowse
            // 
            btnBrowse.Location = new Point(31, 211);
            btnBrowse.Name = "btnBrowse";
            btnBrowse.Size = new Size(88, 24);
            btnBrowse.TabIndex = 8;
            btnBrowse.Text = "Browse...";
            btnBrowse.UseVisualStyleBackColor = true;
            btnBrowse.Click += btnBrowse_Click;
            // 
            // txtWoWPath
            // 
            txtWoWPath.Location = new Point(125, 212);
            txtWoWPath.Name = "txtWoWPath";
            txtWoWPath.Size = new Size(187, 23);
            txtWoWPath.TabIndex = 9;
            // 
            // lblLoadedFont
            // 
            lblLoadedFont.AutoSize = true;
            lblLoadedFont.Location = new Point(159, 50);
            lblLoadedFont.Name = "lblLoadedFont";
            lblLoadedFont.Size = new Size(0, 15);
            lblLoadedFont.TabIndex = 10;
            // 
            // label1
            // 
            label1.AutoSize = true;
            label1.Location = new Point(56, 283);
            label1.Name = "label1";
            label1.Size = new Size(223, 15);
            label1.TabIndex = 11;
            label1.Text = "© Joshua Russell 2024. All rights reserved";
            // 
            // pictureBox1
            // 
            pictureBox1.BackColor = Color.Transparent;
            pictureBox1.Image = (Image)resources.GetObject("pictureBox1.Image");
            pictureBox1.Location = new Point(233, 77);
            pictureBox1.Name = "pictureBox1";
            pictureBox1.Size = new Size(79, 106);
            pictureBox1.SizeMode = PictureBoxSizeMode.StretchImage;
            pictureBox1.TabIndex = 12;
            pictureBox1.TabStop = false;
            // 
            // btnRestoreDefaults
            // 
            btnRestoreDefaults.Location = new Point(175, 241);
            btnRestoreDefaults.Name = "btnRestoreDefaults";
            btnRestoreDefaults.Size = new Size(137, 36);
            btnRestoreDefaults.TabIndex = 13;
            btnRestoreDefaults.Text = "Restore Fonts";
            btnRestoreDefaults.UseVisualStyleBackColor = true;
            btnRestoreDefaults.Click += btnRestoreDefaults_Click;
            // 
            // WoWFontChanger
            // 
            AutoScaleDimensions = new SizeF(7F, 15F);
            AutoScaleMode = AutoScaleMode.Font;
            ClientSize = new Size(343, 305);
            Controls.Add(btnRestoreDefaults);
            Controls.Add(label1);
            Controls.Add(lblLoadedFont);
            Controls.Add(txtWoWPath);
            Controls.Add(btnBrowse);
            Controls.Add(btnReplace);
            Controls.Add(chkQuestFont);
            Controls.Add(chkHugeFont);
            Controls.Add(chkNormalFont);
            Controls.Add(chkUIFont);
            Controls.Add(lblDropArea);
            Controls.Add(pictureBox1);
            Icon = (Icon)resources.GetObject("$this.Icon");
            Name = "WoWFontChanger";
            Text = "WoW Font Changer";
            ((System.ComponentModel.ISupportInitialize)pictureBox1).EndInit();
            ResumeLayout(false);
            PerformLayout();
        }

        #endregion

        private Label lblDropArea;
        private CheckBox chkUIFont;
        private CheckBox chkNormalFont;
        private CheckBox chkHugeFont;
        private CheckBox chkQuestFont;
        private Button btnReplace;
        private Button btnBrowse;
        private TextBox txtWoWPath;
        private Label lblLoadedFont;
        private Label label1;
        private PictureBox pictureBox1;
        private Button btnRestoreDefaults;
    }
}
