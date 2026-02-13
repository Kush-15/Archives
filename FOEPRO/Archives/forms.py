from django import forms
from .models import User
import re

class UserSignUpForm(forms.ModelForm):
    """
    Form for user registration with validation
    """
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'placeholder': 'Enter password',
            'class': 'form-input'
        }),
        min_length=6,
        help_text='Password must be at least 6 characters'
    )
    password_confirm = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'placeholder': 'Confirm password',
            'class': 'form-input'
        }),
        help_text='Enter the same password again'
    )
    
    class Meta:
        model = User
        fields = ['username', 'email', 'phone']
        widgets = {
            'username': forms.TextInput(attrs={
                'placeholder': 'Username',
                'class': 'form-input'
            }),
            'email': forms.EmailInput(attrs={
                'placeholder': 'Email address',
                'class': 'form-input'
            }),
            'phone': forms.TextInput(attrs={
                'placeholder': 'Phone number',
                'class': 'form-input'
            }),
        }
    
    def clean_phone(self):
        """Validate phone number format (10 digits)"""
        phone = self.cleaned_data.get('phone')
        if not re.match(r'^\d{10}$', phone):
            raise forms.ValidationError('Please enter a valid 10-digit phone number.')
        return phone
    
    def clean_username(self):
        """Check if username already exists"""
        username = self.cleaned_data.get('username')
        if User.objects.filter(username=username).exists():
            raise forms.ValidationError('This username is already taken.')
        return username
    
    def clean_email(self):
        """Check if email already exists"""
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError('This email is already registered.')
        return email
    
    def clean(self):
        """Validate that passwords match"""
        cleaned_data = super().clean()
        password = cleaned_data.get('password')
        password_confirm = cleaned_data.get('password_confirm')
        
        if password and password_confirm:
            if password != password_confirm:
                raise forms.ValidationError('Passwords do not match.')
        
        return cleaned_data
    
    def save(self, commit=True):
        """Hash the password before saving"""
        user = super().save(commit=False)
        user.set_password(self.cleaned_data['password'])
        if commit:
            user.save()
        return user


class UserSignInForm(forms.Form):
    """
    Form for user login
    """
    username = forms.CharField(
        max_length=150,
        widget=forms.TextInput(attrs={
            'placeholder': 'Username',
            'class': 'form-input'
        })
    )
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'placeholder': 'Password',
            'class': 'form-input'
        })
    )
    
    def clean(self):
        """Validate user credentials"""
        cleaned_data = super().clean()
        username = cleaned_data.get('username')
        password = cleaned_data.get('password')
        
        if username and password:
            try:
                user = User.objects.get(username=username)
                if not user.verify_password(password):
                    raise forms.ValidationError('Invalid username or password.')
                if not user.is_active:
                    raise forms.ValidationError('This account is inactive.')
            except User.DoesNotExist:
                raise forms.ValidationError('Invalid username or password.')
        
        return cleaned_data
